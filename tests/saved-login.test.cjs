const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, memoryStorage } = require('./load-app.cjs');

test('native saved passwords use device-only SecureStore and can be forgotten', async () => {
  let saved = null; let options;
  const secure = { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only', getItemAsync: async () => saved, setItemAsync: async (_, value, settings) => { saved = value; options = settings; }, deleteItemAsync: async () => { saved = null; } };
  const module = loadApp('app/lib/savedLogin.ts', { 'expo-secure-store': secure });
  await module.saveLoginCredentials('test-doctor', 'test-password');
  assert.deepEqual(await module.getSavedLogin(), { email: 'test-doctor', password: 'test-password' });
  assert.equal(options.keychainAccessible, 'device-only');
  await module.clearSavedLogin();
  assert.equal(await module.getSavedLogin(), null);
});

test('malformed secure credentials are ignored without crashing login', async () => {
  const module = loadApp('app/lib/savedLogin.ts', { 'expo-secure-store': { getItemAsync: async () => 'null' } });
  assert.equal(await module.getSavedLogin(), null);
});

test('legacy passwords are removed from normal user storage', async () => {
  const storage = memoryStorage({ userdata: '{"username":"test-doctor","password":"test-password","practice_id":7}' });
  const { getUserData } = loadApp('app/lib/authdata.tsx', { '@react-native-async-storage/async-storage': storage });
  assert.deepEqual(await getUserData(), { username: 'test-doctor', practice_id: 7 });
  assert.equal(storage.values.get('userdata').includes('password'), false);
});

test('web saved passwords stay in the browser manager, normal storage holds only the email', async () => {
  const oldWindow = global.window; const oldNavigator = Object.getOwnPropertyDescriptor(global, 'navigator');
  let credential; let prevented = false;
  class Password { constructor(data) { Object.assign(this, data, { type: 'password' }); } }
  global.window = { PasswordCredential: Password, isSecureContext: true };
  Object.defineProperty(global, 'navigator', { configurable: true, value: { credentials: { store: async (value) => { credential = value; return value; }, get: async () => credential, preventSilentAccess: async () => { prevented = true; } } } });
  const storage = memoryStorage();
  try {
    const module = loadApp('app/lib/savedLogin.web.ts', { '@react-native-async-storage/async-storage': storage });
    await module.saveLoginCredentials('test-doctor', 'test-password');
    assert.deepEqual(await module.getSavedLogin(), { email: 'test-doctor', password: 'test-password' });
    assert.equal([...storage.values.values()].some((value) => value.includes('test-password')), false);
    await module.clearSavedLogin();
    assert.equal(storage.values.size, 0); assert.equal(prevented, true);
  } finally { global.window = oldWindow; if (oldNavigator) Object.defineProperty(global, 'navigator', oldNavigator); else delete global.navigator; }
});

test('browser mediation rejection does not fail clearing the saved-password preference', async () => {
  const oldWindow = global.window; const oldNavigator = Object.getOwnPropertyDescriptor(global, 'navigator');
  class Password {}
  global.window = { PasswordCredential: Password, isSecureContext: true };
  let retrieved = false;
  Object.defineProperty(global, 'navigator', { configurable: true, value: { credentials: {
    store: async () => null,
    get: async () => { retrieved = true; return null; },
    preventSilentAccess: async () => { throw new DOMException('Blocked in embedded browser', 'NotAllowedError'); },
  } } });
  const storage = memoryStorage({ 'maxscribe.saved-login-email': 'test-doctor' });
  try {
    const module = loadApp('app/lib/savedLogin.web.ts', { '@react-native-async-storage/async-storage': storage });
    await module.clearSavedLogin();
    assert.equal(storage.values.size, 0);
    assert.equal(await module.getSavedLogin(), null);
    assert.equal(retrieved, false);
  } finally { global.window = oldWindow; if (oldNavigator) Object.defineProperty(global, 'navigator', oldNavigator); else delete global.navigator; }
});

test('browser password-save refusals do not persist credentials or a false saved preference', async () => {
  const oldWindow = global.window; const oldNavigator = Object.getOwnPropertyDescriptor(global, 'navigator');
  class Password { constructor(data) { Object.assign(this, data); } }
  global.window = { PasswordCredential: Password, isSecureContext: true };
  const storage = memoryStorage();
  try {
    for (const name of ['NotAllowedError', 'SecurityError', 'NotSupportedError']) {
      Object.defineProperty(global, 'navigator', { configurable: true, value: { credentials: {
        store: async () => { throw new DOMException('Browser declined saving', name); },
        get: async () => null,
      } } });
      const module = loadApp('app/lib/savedLogin.web.ts', { '@react-native-async-storage/async-storage': storage });
      assert.equal(await module.saveLoginCredentials('test-doctor', 'test-password'), false);
      assert.equal(storage.values.size, 0);
    }
  } finally { global.window = oldWindow; if (oldNavigator) Object.defineProperty(global, 'navigator', oldNavigator); else delete global.navigator; }
});

test('real storage failures still reject saved-password updates', async () => {
  const module = loadApp('app/lib/savedLogin.ts', { 'expo-secure-store': {
    setItemAsync: async () => { throw new Error('Keychain unavailable'); },
  } });
  await assert.rejects(module.saveLoginCredentials('test-doctor', 'test-password'), /Keychain unavailable/);
});

test('unsupported browsers never fall back to storing a plain password', async () => {
  const oldWindow = global.window;
  global.window = { isSecureContext: true };
  const storage = memoryStorage();
  try {
    const module = loadApp('app/lib/savedLogin.web.ts', { '@react-native-async-storage/async-storage': storage });
    assert.equal(module.supportsSavedPassword, false);
    await assert.rejects(module.saveLoginCredentials('test-doctor', 'test-password'), /password manager/);
    assert.equal(storage.values.size, 0);
  } finally { global.window = oldWindow; }
});
