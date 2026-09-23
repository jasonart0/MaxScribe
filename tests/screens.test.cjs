const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, hookHarness, findNodes, fakeNative } = require('./load-app.cjs');
const helpers = loadApp('app/lib/helper.tsx', { './utils': { isNotEmpty: (value) => value != null && value !== '' && !(typeof value === 'object' && Object.keys(value).length === 0) } });

function screen(name, options = {}) {
  const harness = hookHarness();
  const messages = []; const requests = []; const routes = [];
  const mocks = {
    react: harness.react, 'react-native': fakeNative,
    'react-native-safe-area-context': { SafeAreaProvider: 'SafeAreaProvider' },
    '@components': { ScreenWrapper: 'Screen', CustomButton: 'Button' },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    '@lib': { ...helpers, isNotEmpty: (value) => value != null && value !== '', setHeight: (value) => value, setWidth: (value) => value, faildMessage: (value) => messages.push(['error', value]), successMessage: (value) => messages.push(['success', value]) },
    'components/confirmationModal': 'Confirm', 'components/CustomDropDown': 'Dropdown',
    'components/EditAble/DynamicEditable': 'Editor', 'components/EditAble/Richtext': 'RichEditor',
    'components/mic': 'Mic', 'components/Section': 'Section',
    'react-native-modal-datetime-picker': 'DatePicker',
    'hooks/usePracticeData': { usePracticeData: () => ({ posList: [], providerList: [], locationList: [], loading: false, error: null }) },
    'hooks/useVoice': () => ({ started: false, processing: false, error: null, results: '', finalResult: '', _destroyRecognizer: async () => {} }),
    'lib/authdata': { getUserData: async () => ({ username: 'test-doctor', practice_id: 7 }) },
    'lib/preload': {
      preloadHome: async () => ({ initialPatients: [], initialError: null }),
      preloadEncounter: options.preloadEncounter || (async () => ({ pos: [], locations: [], providers: [] })),
    },
    './axiosInstance': { post: async (url, body) => { requests.push({ url, body }); if (options.failure) throw new Error('backend failure'); return { data: { success: true } }; } },
  };
  const Component = loadApp('app/screens/voice/' + name + '.tsx', mocks).default;
  const patient = { patient_id: 1, name: 'Test Patient' };
  const props = { route: { params: name === 'Notes' ? { data: { patient, jsonData: { hpi: 'Test history' }, aData: options.noEncounter ? undefined : { id: 1, provider_id: '2', location_id: '3', pos_id: '4', date_created: '2026-09-01T00:00:00.000Z' } } } : { patient, jsonData: { hpi: 'Test history' } } }, navigation: { goBack: () => routes.push('back'), reset: (value) => routes.push(value) } };
  if (name === 'Notes' && options.generatedNote) {
    props.route.params.data = { patient, transcription: 'Test transcript', jsonData: options.generatedNote };
  }
  props.navigation.navigate = (name, params) => routes.push({ name, params });
  return { render: () => harness.render(() => Component(props)), messages, requests, routes };
}

function footerButton(tree) {
  const wrapper = findNodes(tree, (node) => node.type === 'Screen')[0];
  return findNodes(wrapper.props.footerUnScrollable(), (node) => node.type === 'Button')[0];
}

test('saving an encounter submits the current date without showing a date selector', async () => {
  const state = screen('Encounter');
  let tree = state.render();
  assert.equal(findNodes(tree, (node) => node.type === 'DatePicker').length, 0);
  findNodes(tree, (node) => node.type === 'Dropdown').forEach((node, index) => node.props.onSelect({ label: 'test option', value: { id: index + 2 } }));
  tree = state.render();
  footerButton(tree).props.onPress();
  tree = state.render();
  await findNodes(tree, (node) => node.type === 'Confirm')[0].props.onConfirm();
  assert.equal(state.requests.length, 1);
  assert.ok(state.requests[0].body.date_created);
  assert.equal(state.messages.filter(([type]) => type === 'success').length, 1);
  assert.deepEqual(state.routes, [{
    index: 1,
    routes: [
      { name: 'Home' },
      { name: 'PatientDetails', params: { patient: { patient_id: 1, name: 'Test Patient' } } },
    ],
  }]);
});

test('failed encounter saves keep the doctor on the form and show an error', async () => {
  const state = screen('Encounter', { failure: true });
  let tree = state.render();
  findNodes(tree, (node) => node.type === 'Dropdown').forEach((node, index) => node.props.onSelect({ label: 'test option', value: { id: index + 2 } }));
  tree = state.render();
  footerButton(tree).props.onPress();
  tree = state.render();
  await findNodes(tree, (node) => node.type === 'Confirm')[0].props.onConfirm();
  assert.equal(state.messages.filter(([type]) => type === 'success').length, 0);
  assert.equal(state.messages.filter(([type]) => type === 'error').length, 1);
  assert.equal(state.routes.length, 0);
});

test('a missing historical encounter does not show a false sync success', async () => {
  const state = screen('Notes', { noEncounter: true });
  await footerButton(state.render()).props.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(state.requests.length, 0);
  assert.equal(state.routes.length, 0);
  assert.equal(state.messages[0][0], 'error');
});

test('rapid double update sends one historical encounter request', async () => {
  const state = screen('Notes');
  const button = footerButton(state.render());
  button.props.onPress(); button.props.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(state.requests.length, 1);
  assert.deepEqual(state.routes, ['back']);
});

test('non-HTML note text can be edited and is saved as a string', () => {
  const state = screen('Notes');
  let tree = state.render();
  findNodes(tree, (node) => node.type === 'Section')[0].props.onPressEdit();
  tree = state.render();
  findNodes(tree, (node) => node.type === 'Editor')[0].props.setData(['Updated test history']);
  tree = state.render();
  const editWrapper = findNodes(tree, (node) => node.type === 'Screen')[1];
  findNodes(editWrapper.props.footerUnScrollable(), (node) => node.type === 'Button')[0].props.onPress();
  tree = state.render();
  assert.equal(findNodes(tree, (node) => node.type === 'Section')[0].props.data, 'Updated test history');
});

test('structured note fields are editable and preserve hidden codes', () => {
  const harness = hookHarness();
  const Editor = loadApp('app/components/EditAble/DynamicEditable.tsx', { react: harness.react, 'react-native': fakeNative }).default;
  const data = [{ description: 'Before', snomed_ct: '123' }];
  let changed;
  const tree = Editor({ data, setData: (value) => { changed = value; }, excludedKeys: ['snomed_ct'] });
  const input = findNodes(tree, (node) => node.type === 'TextInput')[0];
  assert.notEqual(input.props.editable, false);
  input.props.onChangeText('After');
  assert.deepEqual(changed, [{ description: 'After', snomed_ct: '123' }]);
  assert.equal(data[0].description, 'Before');
});

test('generated note preview displays rich text and updates after saving an edit', () => {
  const state = screen('Notes', { generatedNote: { hpi: '<p>Initial <strong>history</strong></p>' } });
  let tree = state.render();
  const textValues = (value) => findNodes(value, (node) => node.type === 'Text').flatMap((node) => node.props.children);
  assert.ok(textValues(tree).includes('Initial history'));
  assert.ok(!textValues(tree).includes('No content'));
  findNodes(tree, (node) => node.type === 'TouchableOpacity')[0].props.onPress();
  tree = state.render();
  assert.equal(findNodes(tree, (node) => node.type === 'RichEditor')[0].props.htmlContent, '<p>Initial <strong>history</strong></p>');
  findNodes(tree, (node) => node.type === 'RichEditor')[0].props.setHtmlContent('<p>Updated history</p>');
  tree = state.render();
  const editWrapper = findNodes(tree, (node) => node.type === 'Screen')[1];
  findNodes(editWrapper.props.footerUnScrollable(), (node) => node.type === 'Button')[0].props.onPress();
  assert.ok(textValues(state.render()).includes('Updated history'));
});

test('Send to Maximus prepares encounter options before navigating and prevents double taps', async () => {
  let finish; let requests = 0;
  const pending = new Promise((resolve) => { finish = resolve; });
  const state = screen('Notes', { generatedNote: { hpi: 'Ready note' }, preloadEncounter: () => { requests++; return pending; } });
  const button = footerButton(state.render());
  const action = button.props.onPress();
  await button.props.onPress();
  assert.equal(requests, 1);
  assert.equal(state.routes.length, 0);
  assert.equal(footerButton(state.render()).props.isLoading, true);
  const lookups = { pos: [{ id: 1 }], locations: [{ id: 2 }], providers: [{ id: 3 }] };
  finish(lookups);
  await action;
  assert.equal(state.routes[0].name, 'AddEncounter');
  assert.deepEqual(state.routes[0].params.practiceLookups, lookups);
  assert.equal(state.routes[0].params.jsonData.hpi, 'Ready note');
});

test('failed encounter preparation keeps the note visible and allows retry', async () => {
  const state = screen('Notes', { generatedNote: { hpi: 'Ready note' }, preloadEncounter: async () => { throw new Error('Offline'); } });
  await footerButton(state.render()).props.onPress();
  assert.equal(state.routes.length, 0);
  assert.equal(footerButton(state.render()).props.isLoading, false);
  assert.equal(state.messages[0][0], 'error');
});
