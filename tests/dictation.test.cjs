const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, hookHarness } = require('./load-app.cjs');
function dictation(failure = false, transcribe) {
  const harness = hookHarness(); let calls = 0;
  const useVoice = loadApp('app/hooks/useVoice.tsx', {
    react: harness.react,
    './useAudioRecording': { useVoiceRecorder: () => ({ isRecording: true, startRecording: async () => true, stopRecording: async () => 'file:///test.m4a' }) },
    'api/voice': { uploadVoiceFile: async (uri) => { calls++; assert.equal(uri, 'file:///test.m4a'); if (failure) throw new Error('transcription failed'); return transcribe ? transcribe() : 'Test dictation'; } },
  }).default;
  return { get: () => harness.render(useVoice), calls: () => calls };
}
test('note dictation sends recorded audio to the backend and retains the final text', async () => {
  const state = dictation();
  assert.equal(await state.get()._startRecognizing(), true);
  await state.get().clearResults();
  assert.equal(state.calls(), 1);
  assert.equal(state.get().finalResult, 'Test dictation');
  assert.equal(state.get().processing, false);
});
test('dictation double-stop produces one backend request', async () => {
  const state = dictation();
  await Promise.all([state.get().clearResults(), state.get().clearResults()]);
  assert.equal(state.calls(), 1);
});
test('dictation failures reach the screen and release the processing state', async () => {
  const state = dictation(true);
  await state.get().clearResults();
  assert.equal(state.get().error, 'transcription failed');
  assert.equal(state.get().processing, false);
  assert.equal(state.get().finalResult, '');
});
test('closing dictation discards the clip without a backend request', async () => {
  const state = dictation();
  await state.get()._destroyRecognizer();
  assert.equal(state.calls(), 0);
  assert.equal(state.get().finalResult, '');
});

test('closing the note editor discards a late transcription response', async () => {
  let resolve;
  const state = dictation(false, () => new Promise((done) => { resolve = done; }));
  const pending = state.get().clearResults();
  await new Promise((done) => setImmediate(done));
  await state.get()._destroyRecognizer();
  resolve('Late dictation from closed editor');
  await pending;
  assert.equal(state.get().finalResult, '');
  assert.equal(state.get().processing, false);
});
