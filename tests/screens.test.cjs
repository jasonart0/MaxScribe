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
    './axiosInstance': { post: async (url, body) => { requests.push({ url, body }); if (options.failure) throw new Error('backend failure'); return { data: { success: true } }; } },
  };
  const Component = loadApp('app/screens/voice/' + name + '.tsx', mocks).default;
  const patient = { patient_id: 1, name: 'Test Patient' };
  const props = { route: { params: name === 'Notes' ? { data: { patient, jsonData: { hpi: 'Test history' }, aData: options.noEncounter ? undefined : { id: 1, provider_id: '2', location_id: '3', pos_id: '4', date_created: '2026-09-01T00:00:00.000Z' } } } : { patient, jsonData: { hpi: 'Test history' } } }, navigation: { goBack: () => routes.push('back'), reset: (value) => routes.push(value) } };
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
