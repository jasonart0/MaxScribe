const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, hookHarness, fakeNative, findNodes } = require('./load-app.cjs');

test('home preparation preserves load errors without turning successful authentication into a failure', async () => {
  const api = loadApp('app/lib/preload.ts', {
    'api/patients': { fetchPatients: async () => { throw new Error('Offline'); } },
    'api/practice': {},
  });
  const result = await api.preloadHome();
  assert.deepEqual(result.initialPatients, []);
  assert.equal(result.initialError, 'Offline');
});

test('prepared encounter options are ready on first render without a duplicate fetch', () => {
  const harness = hookHarness(); let requests = 0;
  const { usePracticeData } = loadApp('app/hooks/usePracticeData.tsx', {
    react: harness.react,
    'api/practice': { fetchPracticeLookups: async () => { requests++; return {}; } },
  });
  const state = harness.render(() => usePracticeData({ pos: [{ id: 1, name: 'Office' }], locations: [], providers: [] }));
  assert.equal(state.loading, false);
  assert.equal(state.posList[0].label, 'Office');
  assert.equal(requests, 0);
});

test('patient details opens immediately and loads history on the destination screen', () => {
  const harness = hookHarness(); const routes = [];
  let focus;
  const Home = loadApp('app/screens/home/homeScreen.tsx', {
    react: harness.react, 'react-native': fakeNative,
    '@components': { ScreenWrapper: 'Screen', CustomButton: 'Button' },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    '@react-navigation/native': { useFocusEffect: (callback) => { focus = callback; } },
    '@lib': { faildMessage: () => {} },
    'hooks/useDebounce': { useDebounce: (value) => value },
    'api/patients': { fetchPatients: async () => { throw new Error('Unexpected duplicate initial fetch'); } },
    '../../components/CustomSearchBar': 'Search', '../../components/PatientCard': 'Card',
  }).default;
  const patient = { patient_id: 1, name: 'Test Patient' };
  const props = { route: { params: { initialPatients: [patient] } }, navigation: { navigate: (name, params) => routes.push({ name, params }) } };
  const render = () => harness.render(() => Home(props));
  let tree = render(); focus();
  const list = findNodes(tree, (node) => node.type === 'FlatList')[0];
  assert.deepEqual(list.props.data, [patient]);
  assert.equal(findNodes(list.props.ListHeaderComponent, (node) => node.type === 'Button').length, 0);
  list.props.renderItem({ item: patient }).props.onViewPress();
  assert.equal(routes[0].name, 'PatientDetails');
  assert.deepEqual(routes[0].params.patient, patient);
  assert.equal(routes[0].params.initialVisits, undefined);
});

test('rapid patient microphone taps open only one recording screen', () => {
  const harness = hookHarness(); const routes = [];
  let focus;
  const Home = loadApp('app/screens/home/homeScreen.tsx', {
    react: harness.react, 'react-native': fakeNative,
    '@components': { ScreenWrapper: 'Screen', CustomButton: 'Button' },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    '@react-navigation/native': { useFocusEffect: (callback) => { focus = callback; } },
    'api/response': { apiErrorMessage: () => 'Unable to load patients.' },
    'constants/Colors': { COLORS: { background: '#fff', primary: '#00f' } },
    'hooks/useDebounce': { useDebounce: (value) => value },
    'api/patients': { fetchPatients: async () => [] },
    '../../components/CustomSearchBar': 'Search', '../../components/PatientCard': 'Card',
  }).default;
  const patient = { patient_id: 1, name: 'Test Patient' };
  const props = { route: { params: { initialPatients: [patient] } }, navigation: { navigate: (name, params) => routes.push({ name, params }) } };
  const render = () => harness.render(() => Home(props));
  const tree = render(); focus();
  const card = findNodes(tree, (node) => node.type === 'FlatList')[0].props.renderItem({ item: patient });
  card.props.onCallPress();
  card.props.onCallPress();
  assert.equal(routes.length, 1);
  assert.equal(routes[0].name, 'Voice');
});
