const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, hookHarness, findNodes, fakeNative } = require('./load-app.cjs');

function flow(options = {}) {
  const harness = hookHarness();
  const messages = []; const routes = []; const uploads = []; const notes = [];
  const patient = { patient_id: 123, name: 'Release Test' };
  const mocks = {
    react: harness.react,
    'react-native': { ...fakeNative, Pressable: 'Pressable', useWindowDimensions: () => ({ height: 800, width: 390 }) },
    '@components': { ScreenWrapper: 'Screen', CustomButton: 'Button' },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    '@lib': { setHeight: (value) => value, setWidth: (value) => value, faildMessage: (value) => messages.push(value) },
    'components/AnimationLoad': 'Loader', 'components/AudioPlayer': 'Player', 'components/RecordingWaveform': 'Wave',
    'components/AudioProcessingScreen': 'AudioProcessing',
    'components/RecordingVisual': { __esModule: true, default: 'RecordingMic', RecordingBackdrop: 'Backdrop', RecordingWaves: 'Waves' },
    'hooks/useAudioRecording': { useVoiceRecorder: () => {
      const [isRecording, setRecording] = harness.react.useState(true);
      return { isRecording, timer: 5, formatTime: () => '00:00:05', startRecording: async () => setRecording(true),
        stopRecording: async () => { setRecording(false); return 'file:///release-test.m4a'; } };
    } },
    'api/voice': {
      uploadVoiceFile: async (uri) => { uploads.push(uri); if (options.uploadFailure) throw new Error('Transcription failed'); if (options.uploadPending) await options.uploadPending; return options.clipTexts?.[uploads.length - 1] || 'Synthetic release test'; },
      generateChat: async () => { if (options.chatFailure) throw new Error('Conversation failed'); if (options.chatPending) await options.chatPending; return [{ speaker: 'Doctor', text: 'Synthetic release test' }]; },
      generateAINotes: async (text, id) => { notes.push({ text, id }); if (options.noteFailure) throw new Error('Notes failed'); if (options.notePending) await options.notePending; return { hpi: text }; },
    },
  };
  const navigation = { navigate: (screen, params) => routes.push({ screen, params }) };
  const Component = loadApp('app/screens/voice/' + (options.transcript ? 'Transcription' : 'ViceRecorder') + '.tsx', mocks).default;
  const render = () => harness.render(() => Component({ navigation, route: { params: options.transcript ? { data: { patient, transcription: 'Synthetic release test', showChat: [] } } : { patient } } }));
  const button = () => findNodes(findNodes(render(), (node) => node.type === 'Screen')[0].props.footerUnScrollable(), (node) => node.type === 'Button')[0];
  return { render, button, messages, routes, uploads, notes };
}

global.__DEV__ = false;

test('recording Proceed uploads one clip on rapid double tap and opens its transcript', async () => {
  const state = flow();
  await findNodes(state.render(), (node) => node.props?.accessibilityLabel === 'Stop recording')[0].props.onPress();
  const button = state.button();
  await Promise.all([button.props.onPress(), button.props.onPress()]);
  assert.deepEqual(state.uploads, ['file:///release-test.m4a']);
  assert.equal(state.routes.length, 1);
  assert.equal(state.routes[0].screen, 'Transcript');
  assert.equal(state.routes[0].params.data.transcription, 'Synthetic release test');
});

test('failed transcription retains the clip and allows retry without navigating', async () => {
  const state = flow({ uploadFailure: true });
  await findNodes(state.render(), (node) => node.props?.accessibilityLabel === 'Stop recording')[0].props.onPress();
  await state.button().props.onPress();
  assert.equal(state.routes.length, 0);
  assert.deepEqual(state.messages, ['Transcription failed']);
  assert.ok(!state.button().props.isLoading);
  assert.equal(findNodes(state.render(), (node) => node.type === 'RecordingMic')[0].props.processing, false);
  await state.button().props.onPress();
  assert.equal(state.uploads.length, 2);
});

test('conversation failure still opens the usable transcript', async () => {
  const state = flow({ chatFailure: true });
  await findNodes(state.render(), (node) => node.props?.accessibilityLabel === 'Stop recording')[0].props.onPress();
  await state.button().props.onPress();
  assert.deepEqual(state.messages, ['Conversation failed']);
  assert.deepEqual(state.routes[0].params.data.showChat, []);
  assert.equal(state.routes[0].params.data.transcription, 'Synthetic release test');
});

test('Generate Note double tap requests one note for the selected patient', async () => {
  const state = flow({ transcript: true });
  const button = state.button();
  await Promise.all([button.props.onPress(), button.props.onPress()]);
  assert.deepEqual(state.notes, [{ text: 'Synthetic release test', id: 123 }]);
  assert.equal(state.routes.length, 1);
  assert.equal(state.routes[0].screen, 'Notes');
  assert.deepEqual(state.routes[0].params.data.jsonData, { hpi: 'Synthetic release test' });
});

test('failed note generation preserves the transcript and releases retry', async () => {
  const state = flow({ transcript: true, noteFailure: true });
  await state.button().props.onPress();
  assert.equal(state.routes.length, 0);
  assert.deepEqual(state.messages, ['Notes failed']);
  assert.equal(state.button().props.isLoading, false);
  await state.button().props.onPress();
  assert.equal(state.notes.length, 2);
});

test('AI generation keeps the transcript visible with loading only on its action button', async () => {
  let finish;
  const pending = new Promise((resolve) => { finish = resolve; });
  const state = flow({ transcript: true, notePending: pending });
  const action = state.button().props.onPress();
  assert.equal(state.button().props.isLoading, true);
  assert.equal(state.routes.length, 0);
  assert.equal(findNodes(state.render(), (node) => node.type === 'Loader').length, 0);
  assert.equal(findNodes(state.render(), (node) => node.type === 'FlatList').length, 1);
  finish(); await action;
  assert.equal(state.routes[0].screen, 'Notes');
});

test('Proceed changes the recording mic to inline progress through transcription and conversation preparation', async () => {
  let finishUpload; let finishChat;
  const uploadPending = new Promise((resolve) => { finishUpload = resolve; });
  const chatPending = new Promise((resolve) => { finishChat = resolve; });
  const state = flow({ uploadPending, chatPending });
  await findNodes(state.render(), (node) => node.props?.accessibilityLabel === 'Stop recording')[0].props.onPress();
  const action = state.button().props.onPress();
  const loader = () => findNodes(state.render(), (node) => node.type === 'RecordingMic')[0];
  assert.equal(loader().props.processing, true);
  assert.equal(loader().props.stage, 'transcribing');
  assert.equal(findNodes(state.render(), (node) => node.type === 'AudioProcessing').length, 0);
  assert.ok(!state.button().props.isLoading);
  assert.equal(state.button().props.disabled, true);
  assert.equal(state.routes.length, 0);
  finishUpload(); await new Promise((resolve) => setImmediate(resolve));
  assert.equal(loader().props.processing, true);
  assert.equal(loader().props.stage, 'conversation');
  assert.equal(state.routes.length, 0);
  finishChat(); await action;
  assert.equal(loader().props.processing, false);
  assert.equal(state.routes[0].screen, 'Transcript');
});

test('recording again retains both clips and Proceed combines their transcripts in recording order', async () => {
  const state = flow({ clipTexts: ['First clip history', 'Second clip history'] });
  const stop = () => findNodes(state.render(), (node) => node.props?.accessibilityLabel === 'Stop recording')[0].props.onPress();
  await stop();
  const footer = () => findNodes(state.render(), (node) => node.type === 'Screen')[0].props.footerUnScrollable();
  await findNodes(footer(), (node) => node.props?.accessibilityLabel === 'Record another clip')[0].props.onPress();
  await stop();
  assert.equal(findNodes(footer(), (node) => node.type === 'Player').length, 2);
  await state.button().props.onPress();
  assert.equal(state.uploads.length, 2);
  assert.equal(state.routes[0].params.data.transcription, 'First clip history\n\nSecond clip history');
});

test('deleting a clip excludes it from the combined transcription', async () => {
  const state = flow();
  const stop = () => findNodes(state.render(), (node) => node.props?.accessibilityLabel === 'Stop recording')[0].props.onPress();
  await stop();
  const footer = () => findNodes(state.render(), (node) => node.type === 'Screen')[0].props.footerUnScrollable();
  await findNodes(footer(), (node) => node.props?.accessibilityLabel === 'Record another clip')[0].props.onPress();
  await stop();
  findNodes(footer(), (node) => node.props?.accessibilityLabel === 'Delete clip 1')[0].props.onPress();
  await state.button().props.onPress();
  assert.equal(state.uploads.length, 1);
});
