const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, hookHarness, findNodes, fakeNative } = require('./load-app.cjs');

function loginScreen(options = {}) {
  const harness = hookHarness(); const messages = []; const routes = []; const saved = [];
  const Component = loadApp('app/screens/auth/loginScreen.tsx', {
    react: harness.react,
    'react-native': { ...fakeNative, Pressable: 'Pressable', KeyboardAvoidingView: 'KeyboardAvoidingView', Platform: { OS: 'web' }, useWindowDimensions: () => ({ height: 800 }) },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    'components/AppBackground': 'Background',
    '../../../assets/images/logo.png': 1, '../../../assets/images/login-doctor.png': 2,
    '@lib': { isNotEmpty: (value) => !!value.trim(), faildMessage: (message) => messages.push(['error', message]), successMessage: (message, description) => messages.push(['success', message, description]) },
    'api/auth': { loginUser: async () => ({ success: true }) },
    'lib/authdata': { getUserData: async () => null },
    'lib/savedLogin': {
      supportsSavedPassword: true, getSavedLogin: async () => null,
      clearSavedLogin: async () => {},
      saveLoginCredentials: async (email, password) => {
        saved.push({ email, password });
        if (options.failure) throw new Error('Storage unavailable');
        return options.declined ? false : true;
      },
    },
  }).default;
  const render = () => harness.render(() => Component({ navigation: { replace: (route) => routes.push(route) } }));
  const tree = render();
  findNodes(tree, (node) => node.type === 'TextInput').forEach((node) => node.props.onChangeText(node.props.placeholder === 'Password' ? 'test-password' : 'test-doctor'));
  findNodes(tree, (node) => node.props?.accessibilityRole === 'checkbox')[0].props.onPress();
  return { render, messages, routes, saved };
}

test('browser password-manager refusal keeps successful login and avoids the red error', async () => {
  const state = loginScreen({ declined: true });
  const password = findNodes(state.render(), (node) => node.props?.placeholder === 'Password')[0];
  await password.props.onSubmitEditing();
  assert.deepEqual(state.routes, ['Home']);
  assert.deepEqual(state.saved, [{ email: 'test-doctor', password: 'test-password' }]);
  assert.equal(state.messages.filter(([type]) => type === 'error').length, 0);
  assert.match(state.messages[0][2], /browser.*password manager/);
});

test('actual password storage failure remains visible without blocking authenticated login', async () => {
  const state = loginScreen({ failure: true });
  await findNodes(state.render(), (node) => node.props?.placeholder === 'Password')[0].props.onSubmitEditing();
  assert.deepEqual(state.routes, ['Home']);
  assert.equal(state.messages.filter(([type]) => type === 'error').length, 1);
});
