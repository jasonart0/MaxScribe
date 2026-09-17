const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, hookHarness } = require('./load-app.cjs');

function recording(options = {}) {
  const harness = hookHarness();
  const calls = [];
  const recorder = {
    uri: 'file:///test.m4a',
    async prepareToRecordAsync() { calls.push('prepare'); },
    record() { calls.push('record'); },
    pause() { calls.push('pause'); },
    async stop() { calls.push('stop'); if (options.stopFailure) throw new Error('stop failed'); },
  };
  let preset;
  const expo = {
    RecordingPresets: { HIGH_QUALITY: { extension: '.m4a', sampleRate: 44100 } },
    async requestRecordingPermissionsAsync() { calls.push('permission'); return { granted: options.permission !== false }; },
    async setAudioModeAsync(mode) { calls.push(mode); },
    useAudioRecorder(value) { preset = value; return recorder; },
    useAudioRecorderState() { return { durationMillis: 1500, metering: -20 }; },
  };
  const { useVoiceRecorder } = loadApp('app/hooks/useAudioRecording.tsx', { react: harness.react, 'expo-audio': expo });
  return { get: () => harness.render(useVoiceRecorder), calls, recorder, preset: () => preset, unmount: harness.unmount };
}

test('recording uses the default Expo preset, metering only changes the wave display', async () => {
  const state = recording();
  const first = state.get();
  assert.equal(await first.startRecording(), true);
  assert.deepEqual(state.preset(), { extension: '.m4a', sampleRate: 44100, isMeteringEnabled: true });
  assert.deepEqual(state.calls.slice(0, 4), ['permission', { allowsRecording: true, playsInSilentMode: true }, 'prepare', 'record']);
  assert.equal(state.get().isRecording, true);
  assert.equal(state.get().timer, 1);
  assert.equal(state.get().metering, -20);
  assert.equal(state.get().formatTime(3661), '01:01:01');
});

test('permission denial does not start a fake recording', async () => {
  const state = recording({ permission: false });
  assert.equal(await state.get().startRecording(), false);
  assert.equal(state.get().isRecording, false);
  assert.match(state.get().recordingError, /microphone/);
  assert.equal(state.calls.includes('record'), false);
});

test('rapid double start creates one recording session', async () => {
  const state = recording();
  await Promise.all([state.get().startRecording(), state.get().startRecording()]);
  assert.equal(state.calls.filter((call) => call === 'record').length, 1);
});

test('pause, resume and stop keep the recorded URI and reset the UI', async () => {
  const state = recording();
  await state.get().startRecording();
  await state.get().pauseRecording();
  assert.equal(state.get().isPaused, true);
  await state.get().resumeRecording();
  assert.equal(state.get().isPaused, false);
  assert.equal(await state.get().stopRecording(), 'file:///test.m4a');
  assert.equal(state.get().isRecording, false);
  assert.equal(state.get().isBusy, false);
  assert.equal(await state.get().startRecording(), true);
});

test('leaving the screen also stops a paused recording', async () => {
  const state = recording();
  await state.get().startRecording();
  await state.get().pauseRecording();
  state.unmount();
  assert.equal(state.calls.filter((call) => call === 'stop').length, 1);
});

test('stop failure reports an error and allows a new recording attempt', async () => {
  const state = recording({ stopFailure: true });
  await state.get().startRecording();
  assert.equal(await state.get().stopRecording(), null);
  assert.match(state.get().recordingError, /stop failed/);
  assert.equal(state.get().isBusy, false);
  assert.equal(await state.get().startRecording(), true);
});
