const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, hookHarness } = require('./load-app.cjs');

function recording(options = {}) {
  const harness = hookHarness();
  const calls = [];
  let duration = 1500;
  let listener;
  const recorder = {
    uri: 'file:///test.m4a',
    async prepareToRecordAsync() { calls.push('prepare'); },
    record() { calls.push('record'); },
    pause() { calls.push('pause'); },
    getStatus() { return { durationMillis: duration }; },
    async stop() { calls.push('stop'); if (options.stopFailure) throw new Error('stop failed'); duration = 0; },
  };
  let preset;
  const expo = {
    RecordingPresets: {
      HIGH_QUALITY: { extension: '.m4a', sampleRate: 44100 },
      LOW_QUALITY: {
        extension: '.m4a', sampleRate: 44100, numberOfChannels: 2, bitRate: 64000,
        android: { extension: '.3gp', outputFormat: '3gp', audioEncoder: 'amr_nb' },
        web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
      },
    },
    async requestRecordingPermissionsAsync() { calls.push('permission'); return { granted: options.permission !== false }; },
    async setAudioModeAsync(mode) { calls.push(mode); },
    useAudioRecorder(value, callback) { preset = value; listener = callback; return recorder; },
    useAudioRecorderState() { return { durationMillis: duration, metering: -20 }; },
  };
  const keepAwake = {
    async activateKeepAwakeAsync(tag) { calls.push(['keep-awake', tag]); },
    async deactivateKeepAwake(tag) { calls.push(['allow-sleep', tag]); },
  };
  const { useVoiceRecorder } = loadApp('app/hooks/useAudioRecording.tsx', {
    react: harness.react,
    'expo-audio': expo,
    'expo-keep-awake': keepAwake,
  });
  return { get: () => harness.render(useVoiceRecorder), calls, recorder, preset: () => preset, unmount: harness.unmount, notify: (status) => listener(status) };
}

test('recording targets a 1.8 MB twenty-minute visit with mono 12 kbps speech audio', async () => {
  const state = recording();
  const first = state.get();
  assert.equal(await first.startRecording(), true);
  assert.deepEqual(state.preset(), {
    extension: '.caf', sampleRate: 16000, numberOfChannels: 1, bitRate: 12000,
    android: { extension: '.m4a', outputFormat: 'mpeg4', audioEncoder: 'aac' },
    ios: { audioQuality: 0x60, extension: '.caf', outputFormat: 'opus', sampleRate: 16000 },
    web: { mimeType: 'audio/webm;codecs=opus', bitsPerSecond: 12000 }, isMeteringEnabled: true,
  });
  assert.equal((12000 * 20 * 60) / 8 / 1000000, 1.8);
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

test('the screen stays awake for the whole recording session and is released after stop', async () => {
  const state = recording();
  await state.get().startRecording();
  state.get();
  assert.deepEqual(state.calls.filter(Array.isArray), [['keep-awake', 'MaxScribeVoiceRecording']]);

  await state.get().pauseRecording();
  state.get();
  assert.deepEqual(state.calls.filter(Array.isArray), [['keep-awake', 'MaxScribeVoiceRecording']]);

  await state.get().stopRecording();
  state.get();
  assert.deepEqual(state.calls.filter(Array.isArray), [
    ['keep-awake', 'MaxScribeVoiceRecording'],
    ['allow-sleep', 'MaxScribeVoiceRecording'],
  ]);
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
  assert.equal(state.get().timer, 1);
  assert.equal(await state.get().startRecording(), true);
});

test('Expo media service reset leaves recording mode and permits a fresh session', async () => {
  const state = recording();
  await state.get().startRecording();
  await state.get().pauseRecording();
  state.notify({ hasError: false, mediaServicesDidReset: true });
  assert.equal(state.get().isRecording, false);
  assert.equal(state.get().isPaused, false);
  assert.match(state.get().recordingError, /interrupted/);
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
