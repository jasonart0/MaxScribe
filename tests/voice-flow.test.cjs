const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, hookHarness, findNodes, fakeNative } = require('./load-app.cjs');

function flow(options = {}) {
  const harness = hookHarness();
  const messages = []; const routes = []; const uploads = []; const notes = []; const backEvents = []; const listeners = [];
  const patient = { patient_id: 123, name: 'Release Test' };
  const mocks = {
    react: harness.react,
    'react-native': { ...fakeNative, Platform: { OS: options.platform ?? 'ios' }, Pressable: 'Pressable', useWindowDimensions: () => ({ height: 800, width: 390 }) },
    '@components': { ScreenWrapper: 'Screen', CustomButton: 'Button' },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    '@local-test-audio': options.localAudio ? 7 : null,
    'expo-asset': { Asset: { fromModule: () => ({ uri: 'file:///local-test-audio.mp3', downloadAsync: async () => {} }) } },
    'expo-file-system/legacy': { getInfoAsync: async () => ({ exists: true, size: options.fileSize ?? 1572864 }) },
    '@lib': { setHeight: (value) => value, setWidth: (value) => value, faildMessage: (value) => messages.push(value) },
    'components/AnimationLoad': 'Loader', 'components/AudioPlayer': 'Player', 'components/RecordingWaveform': 'Wave',
    'components/AudioProcessingScreen': 'AudioProcessing',
    'components/RecordingVisual': { __esModule: true, default: 'RecordingMic', RecordingBackdrop: 'Backdrop', RecordingWaves: 'Waves' },
    'hooks/useAudioRecording': { useVoiceRecorder: () => {
      const [isRecording, setRecording] = harness.react.useState(options.initialRecording ?? true);
      return { isRecording, timer: 5, formatTime: () => '00:00:05', startRecording: async () => setRecording(true),
        stopRecording: async () => { setRecording(false); return 'file:///release-test.m4a'; } };
    } },
    'api/voice': {
      uploadVoiceFile: async (uri, progressOptions) => { uploads.push(uri); progressOptions?.onUploadProgress?.(35); if (options.uploadVoiceFile) return options.uploadVoiceFile(uri, uploads.length, progressOptions); if (options.uploadFailure) throw new Error('Transcription failed'); progressOptions?.onUploadProgress?.(100); if (options.uploadPending) await options.uploadPending; return options.clipTexts?.[uploads.length - 1] || 'Synthetic release test'; },
      generateChat: async () => { if (options.chatFailure) throw new Error('Conversation failed'); if (options.chatPending) await options.chatPending; return [{ speaker: 'Doctor', text: 'Synthetic release test' }]; },
      generateAINotes: async (text, id) => { notes.push({ text, id }); if (options.noteFailure) throw new Error('Notes failed'); if (options.notePending) await options.notePending; return { hpi: text }; },
    },
  };
  const navigation = {
    navigate: (screen, params) => routes.push({ screen, params }),
    goBack: () => backEvents.push('back'),
    dispatch: (action) => backEvents.push(action),
    addListener: (name, callback) => { listeners.push({ name, callback }); return () => {}; },
  };
  const Component = loadApp('app/screens/voice/' + (options.transcript ? 'Transcription' : 'ViceRecorder') + '.tsx', mocks).default;
  const render = () => harness.render(() => Component({ navigation, route: { params: options.transcript
    ? { data: { patient, transcription: 'Synthetic release test', showChat: [], encounterDefaults: options.encounterDefaults } }
    : { patient, encounterDefaults: options.encounterDefaults } } }));
  const button = () => findNodes(findNodes(render(), (node) => node.type === 'Screen')[0].props.footerUnScrollable(), (node) => node.type === 'Button')[0];
  return { render, button, messages, routes, uploads, notes, backEvents, listeners };
}

global.__DEV__ = false;

test('back while recording requires confirmation before discarding audio', async () => {
  const state = flow();
  const screen = findNodes(state.render(), (node) => node.type === 'Screen')[0];
  findNodes(screen.props.headerUnScrollable(), (node) => node.props?.accessibilityLabel === 'Go back')[0].props.onPress();
  assert.equal(state.backEvents.length, 0);
  const dialog = findNodes(state.render(), (node) => node.type === 'Modal')[0];
  assert.equal(dialog.props.visible, true);
  findNodes(dialog, (node) => node.props?.accessibilityLabel === 'Discard recording')[0].props.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(state.backEvents, ['back']);
});

test('back with a saved clip requires confirmation before leaving', async () => {
  const state = flow();
  await findNodes(state.render(), (node) => node.props?.accessibilityLabel === 'Stop recording')[0].props.onPress();
  const screen = findNodes(state.render(), (node) => node.type === 'Screen')[0];
  findNodes(screen.props.headerUnScrollable(), (node) => node.props?.accessibilityLabel === 'Go back')[0].props.onPress();
  assert.equal(state.backEvents.length, 0);
  const dialog = findNodes(state.render(), (node) => node.type === 'Modal')[0];
  assert.equal(dialog.props.visible, true);
  findNodes(dialog, (node) => node.props?.accessibilityLabel === 'Discard recording')[0].props.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(state.backEvents, ['back']);
});

test('system back while recording confirms before dispatching the pending action', async () => {
  const state = flow();
  state.render();
  const listener = state.listeners.find(({ name }) => name === 'beforeRemove');
  assert.ok(listener);
  let prevented = false;
  const action = { type: 'GO_BACK' };
  listener.callback({ preventDefault: () => { prevented = true; }, data: { action } });
  assert.equal(prevented, true);
  const dialog = findNodes(state.render(), (node) => node.type === 'Modal')[0];
  assert.equal(dialog.props.visible, true);
  findNodes(dialog, (node) => node.props?.accessibilityLabel === 'Discard recording')[0].props.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(state.backEvents, [action]);
});

test('a saved recording displays its file size', async () => {
  const state = flow({ fileSize: 1572864 });
  await findNodes(state.render(), (node) => node.props?.accessibilityLabel === 'Stop recording')[0].props.onPress();
  const footer = findNodes(state.render(), (node) => node.type === 'Screen')[0].props.footerUnScrollable();
  const labels = findNodes(footer, (node) => node.type === 'Text')
    .map((node) => node.props.children.flat(Infinity).join(''));
  assert.ok(labels.includes('Clip 1 · 00:00:05 · 1.5 MB'));
});

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

test('production recording screen waits for Start Recording and hides local test audio', () => {
  const state = flow({ initialRecording: false, localAudio: true });
  assert.equal(findNodes(state.render(), (node) => node.props?.accessibilityLabel === 'Start recording').length, 1);
  assert.equal(findNodes(state.render(), (node) => node.props?.accessibilityLabel === 'Use local test audio').length, 0);
});

test('development test audio enters the normal upload and transcription flow', async () => {
  global.__DEV__ = true;
  try {
    const state = flow({ localAudio: true, initialRecording: false });
    assert.equal(findNodes(state.render(), (node) => node.props?.accessibilityLabel === 'Start recording').length, 1);
    assert.equal(findNodes(state.render(), (node) => node.props?.accessibilityLabel === 'Use local test audio').length, 1);
    findNodes(state.render(), (node) => node.props?.accessibilityLabel === 'Use local test audio')[0].props.onPress();
    await new Promise((resolve) => setImmediate(resolve));
    await state.button().props.onPress();
    assert.deepEqual(state.uploads, ['file:///local-test-audio.mp3']);
    assert.equal(state.routes[0].screen, 'Transcript');
  } finally { global.__DEV__ = false; }
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

test('scheduled encounter defaults survive recording and note generation', async () => {
  const encounterDefaults = { providerId: '22', locationId: '33' };
  const recording = flow({ encounterDefaults });
  await findNodes(recording.render(), (node) => node.props?.accessibilityLabel === 'Stop recording')[0].props.onPress();
  await recording.button().props.onPress();
  assert.deepEqual(recording.routes[0].params.data.encounterDefaults, encounterDefaults);

  const transcript = flow({ transcript: true, encounterDefaults });
  await transcript.button().props.onPress();
  assert.deepEqual(transcript.routes[0].params.data.encounterDefaults, encounterDefaults);
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

test('AI generation keeps the transcript visible behind a page loader', async () => {
  let finish;
  const pending = new Promise((resolve) => { finish = resolve; });
  const state = flow({ transcript: true, notePending: pending });
  const action = state.button().props.onPress();
  assert.equal(state.button().props.isLoading, true);
  assert.equal(state.routes.length, 0);
  assert.equal(findNodes(state.render(), (node) => node.type === 'Screen')[0].props.loading, true);
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

test('retrying a failed clip retains completed transcripts and does not upload them twice', async () => {
  const state = flow({ uploadVoiceFile: async (_uri, attempt) => {
    if (attempt === 2) throw new Error('Second clip failed');
    return attempt === 1 ? 'First clip' : 'Second clip';
  } });
  const stop = () => findNodes(state.render(), (node) => node.props?.accessibilityLabel === 'Stop recording')[0].props.onPress();
  await stop();
  const footer = () => findNodes(state.render(), (node) => node.type === 'Screen')[0].props.footerUnScrollable();
  await findNodes(footer(), (node) => node.props?.accessibilityLabel === 'Record another clip')[0].props.onPress();
  await stop();
  await state.button().props.onPress();
  assert.equal(state.routes.length, 0);
  assert.equal(findNodes(footer(), (node) => node.type === 'Player').length, 2);
  await state.button().props.onPress();
  assert.equal(state.uploads.length, 3);
  assert.equal(state.routes[0].params.data.transcription, 'First clip\n\nSecond clip');
});
