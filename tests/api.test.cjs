const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, memoryStorage, Multipart } = require('./load-app.cjs');

// Mock the native HTTP boundary while keeping the real voice request logic.
function loadVoice(mocks) {
  return loadApp('app/api/voice.js', { './axiosInstance': { async post(path, body, config) {
    assert.equal(config.adapter, 'xhr');
    assert.equal(config.timeout, 120000);
    assert.equal(config.headers['Content-Type'], 'multipart/form-data');
    const response = await global.fetch('https://ehr.maximus.care/maximuscare-ehr' + path, { ...config, body });
    const data = JSON.parse(await response.text());
    if (response.ok === false) throw { response: { status: response.status, data } };
    return { status: response.status || 200, data };
  } }, ...mocks });
}

test('login stores the parsed user and practice, without the password', async () => {
  const storage = memoryStorage();
  const calls = [];
  const api = { async post(url, body) { calls.push({ url, body }); return url === '/auth/token' ? { data: { data: { access_token: 'test-token' } } } : { data: { user_id: 42, practice_id: 7 } }; } };
  const { loginUser } = loadApp('app/api/auth.js', { '@react-native-async-storage/async-storage': storage, './axiosInstance': api });
  assert.equal((await loginUser('test-doctor', 'test-password')).success, true);
  assert.equal(storage.values.get('token'), 'test-token');
  assert.deepEqual(JSON.parse(storage.values.get('userdata')), { username: 'test-doctor', id: 42, practice_id: 7 });
  assert.equal(calls[0].body.password, 'test-password');
  assert.equal(storage.values.get('userdata').includes('password'), false);
});

test('practice parse failure rolls back the partial login', async () => {
  const storage = memoryStorage();
  const api = { async post(url) { return url === '/auth/token' ? { data: { data: { access_token: 'test-token' } } } : { data: {} }; } };
  const { loginUser } = loadApp('app/api/auth.js', { '@react-native-async-storage/async-storage': storage, './axiosInstance': api });
  const result = await loginUser('test-doctor', 'test-password');
  assert.equal(result.success, false);
  assert.match(result.message, /practice/i);
  assert.equal(storage.values.has('token'), false);
  assert.equal(storage.values.has('userdata'), false);
});

test('HTTP 200 with no token does not sign in', async () => {
  const { loginUser } = loadApp('app/api/auth.js', { '@react-native-async-storage/async-storage': memoryStorage(), './axiosInstance': { post: async () => ({ data: { data: {} } }) } });
  assert.equal((await loginUser('test', 'test')).success, false);
});

test('authentication rejection returns a readable error', async () => {
  const api = { post: async () => { throw { response: { status: 403, data: { message: 'Invalid login' } } }; } };
  const { loginUser } = loadApp('app/api/auth.js', { '@react-native-async-storage/async-storage': memoryStorage(), './axiosInstance': api });
  assert.equal((await loginUser('test', 'test')).message, 'Invalid login');
});

test('patient search sends criteria in param_list using the live backend contract', async () => {
  let body;
  const { fetchPatientsbySearch } = loadApp('app/api/patients.js', { 'lib/authdata': { getUserData: async () => ({ username: 'test-doctor' }) }, './axiosInstance': { post: async (_, value) => { body = value; return { data: { data: { records: [{ patient_id: 1 }] } } }; } } });
  assert.deepEqual(await fetchPatientsbySearch('  sample  '), [{ patient_id: 1 }]);
  assert.equal(body.criteria, 'sample');
  assert.deepEqual(body.param_list, [{ name: 'criteria', value: 'sample' }]);
  assert.equal(body.pageSize, 50);
  assert.equal(body.option, 'DEFAULT');
});

test('a patient API outage remains an error instead of an empty list', async () => {
  const { fetchPatients } = loadApp('app/api/patients.js', { 'lib/authdata': { getUserData: async () => ({ username: 'test-doctor' }) }, './axiosInstance': { post: async () => { throw new Error('offline'); } } });
  await assert.rejects(fetchPatients(), /offline/);
});

test('missing session stops patient search before a request', async () => {
  let called = false;
  const { fetchPatients } = loadApp('app/api/patients.js', { 'lib/authdata': { getUserData: async () => null }, './axiosInstance': { post: async () => { called = true; } } });
  await assert.rejects(fetchPatients(), /sign in/i);
  assert.equal(called, false);
});

test('history encodes patient IDs as a single query parameter', async () => {
  let url;
  const { fetchPatientHistory } = loadApp('app/api/patients.js', { 'lib/authdata': {}, './axiosInstance': { get: async (value) => { url = value; return { data: [] }; } } });
  await fetchPatientHistory('abc&another=value');
  assert.equal(url, '/encounter/getPatientScribeData?patient_id=abc%26another%3Dvalue');
});

test('patient images use the document download contract', async () => {
  let request;
  const { fetchPatientImage } = loadApp('app/api/patients.js', {
    'lib/authdata': {},
    './axiosInstance': { post: async (url, body, config) => {
      request = { url, body, config };
      return { data: { data: { url: 'https://ehr.maximus.care/media/patient.jpg' } } };
    } },
  });
  assert.equal(await fetchPatientImage(42), 'https://ehr.maximus.care/media/patient.jpg');
  assert.deepEqual(request.body, { link: '42.png', document_category: 'PatientImages' });
  assert.equal(request.config.responseType, 'blob');
});

test('all encounter lookups use the signed-in practice ID', async () => {
  const urls = [];
  const { fetchPracticeLookups } = loadApp('app/api/practice.ts', { 'lib/authdata': { getUserData: async () => ({ practice_id: 7 }) }, './axiosInstance': { get: async (url) => { urls.push(url); return { data: { data: [] } }; } } });
  assert.deepEqual(await fetchPracticeLookups(), { pos: [], locations: [], providers: [] });
  assert.deepEqual(urls, ['/claim/getPracticePOSList/7', '/lookup/getlocationList?practice_id=7', '/lookup/getProviderList?practice_id=7']);
});

test('lookup requests reject missing practice information', async () => {
  const { fetchPracticeLookups } = loadApp('app/api/practice.ts', { 'lib/authdata': { getUserData: async () => ({ username: 'test' }) }, './axiosInstance': {} });
  await assert.rejects(fetchPracticeLookups(), /practice/);
});

const scribe = { patient_id: 1, practice_id: 7, provider_id: '2', location_id: '3', pos_id: '4', created_user: 'test-doctor', chart_id: '', deleted: false, date_created: '2026-09-17T00:00:00.000Z', notes_data: '{"hpi":"test note"}' };
test('encounter save posts the clinical note and selected date', async () => {
  let sent;
  const { savePatientScribeData } = loadApp('app/api/Encounter.tsx', { './axiosInstance': { post: async (url, body) => { sent = { url, body }; return { data: { success: true, id: 1 } }; } } });
  assert.equal((await savePatientScribeData(scribe)).success, true);
  assert.equal(sent.url, '/encounter/savePatientScribeData');
  assert.equal(sent.body.date_created, scribe.date_created);
  assert.equal(sent.body.notes_data, scribe.notes_data);
});

test('HTTP 200 with success=false never reports a saved encounter', async () => {
  const { savePatientScribeData } = loadApp('app/api/Encounter.tsx', { './axiosInstance': { post: async () => ({ data: { success: false, message: 'Save rejected' } }) } });
  await assert.rejects(savePatientScribeData(scribe), /Save rejected/);
});

test('an incomplete or empty encounter is not posted', async () => {
  let called = false;
  const { savePatientScribeData } = loadApp('app/api/Encounter.tsx', { './axiosInstance': { post: async () => { called = true; } } });
  await assert.rejects(savePatientScribeData({ ...scribe, provider_id: undefined }), /required/);
  await assert.rejects(savePatientScribeData({ ...scribe, notes_data: '{}' }), /clinical note/);
  assert.equal(called, false);
});

test('unexpected list formats and backend errors are not hidden', () => {
  const { extractList } = loadApp('app/api/response.ts');
  assert.throws(() => extractList({ data: { unexpected: 'value' } }), /unexpected list/);
  assert.throws(() => extractList({ success: false, message: 'Access denied' }), /Access denied/);
});

test('AI transcription preserves native file and content URIs and MIME types', async () => {
  const oldFetch = global.fetch;
  const oldForm = global.FormData;
  const requests = [];
  global.FormData = Multipart;
  global.fetch = async (url, options) => { requests.push({ url, options }); return { ok: true, text: async () => '{"data":{"text":" Test transcript "}}' }; };
  try {
    const { uploadVoiceFile } = loadVoice({ '@react-native-async-storage/async-storage': memoryStorage({ token: 'test-token' }), 'react-native': { Platform: { OS: 'ios' } } });
    assert.equal(await uploadVoiceFile('file:///test.m4a'), 'Test transcript');
    assert.deepEqual(requests[0].options.body.get('audioFile'), { uri: 'file:///test.m4a', name: 'recording.m4a', type: 'audio/mp4' });
    assert.match(requests[0].url, /\/ai-assistant\/transcribeAudio$/);
    assert.equal(requests[0].options.headers['Content-Type'], 'multipart/form-data');
    await uploadVoiceFile('content://media/test.wav');
    assert.equal(requests[1].options.body.get('audioFile').uri, 'content://media/test.wav');
    assert.equal(requests[1].options.body.get('audioFile').type, 'audio/wav');
  } finally { global.fetch = oldFetch; global.FormData = oldForm; }
});

test('web transcription uploads the recorded blob with the correct codec extension', async () => {
  const oldFetch = global.fetch; const oldForm = global.FormData;
  global.FormData = Multipart;
  const blob = new Blob(['sample'], { type: 'audio/webm;codecs=opus' });
  let posted;
  global.fetch = async (_, options) => options ? (posted = options, { ok: true, text: async () => '{"text":"test"}' }) : { ok: true, blob: async () => blob };
  try {
    const { uploadVoiceFile } = loadVoice({ '@react-native-async-storage/async-storage': memoryStorage({ token: 'test-token' }), 'react-native': { Platform: { OS: 'web' } } });
    assert.equal(await uploadVoiceFile('blob:test'), 'test');
    assert.equal(posted.body.get('audioFile'), blob);
    assert.equal(posted.body.fields[0][2], 'recording.webm');
  } finally { global.fetch = oldFetch; global.FormData = oldForm; }
});

test('empty web audio does not reach the backend', async () => {
  const { sendToAPI } = loadVoice({ '@react-native-async-storage/async-storage': memoryStorage(), 'react-native': { Platform: { OS: 'web' } } });
  await assert.rejects(sendToAPI('blob:test', { blob: new Blob([]) }), /empty/);
});

test('missing AI session and empty transcripts return actionable errors', async () => {
  const oldFetch = global.fetch;
  try {
    const missingSession = loadVoice({ '@react-native-async-storage/async-storage': memoryStorage(), 'react-native': { Platform: { OS: 'android' } } });
    await assert.rejects(missingSession.uploadVoiceFile('file:///test.m4a'), /sign in/);
    global.fetch = async () => ({ ok: true, text: async () => '{"data":{"text":""}}' });
    const voice = loadVoice({ '@react-native-async-storage/async-storage': memoryStorage({ token: 'test-token' }), 'react-native': { Platform: { OS: 'android' } } });
    await assert.rejects(voice.uploadVoiceFile('file:///test.m4a'), /No transcript/);
  } finally { global.fetch = oldFetch; }
});

test('AI conversation and notes use processRequest and parse serialized JSON', async () => {
  const oldFetch = global.fetch; const oldForm = global.FormData;
  const models = [];
  global.FormData = Multipart;
  global.fetch = async (url, options) => {
    assert.match(url, /\/ai-assistant\/processRequest$/);
    const model = JSON.parse(options.body.get('ai_request')); models.push(model);
    const content = model.action === 'TRANSCRIPT_TO_CONVERSATION' ? { conversation: '[{"speaker":"Doctor","text":"test"}]' } : { hpi: 'test' };
    return { ok: true, text: async () => JSON.stringify({ data: { content: JSON.stringify(content) } }) };
  };
  try {
    const voice = loadVoice({ '@react-native-async-storage/async-storage': memoryStorage({ token: 'test-token' }), 'react-native': { Platform: { OS: 'ios' } } });
    assert.deepEqual(await voice.generateChat('test transcript'), [{ speaker: 'Doctor', text: 'test' }]);
    assert.deepEqual(await voice.generateAINotes('test transcript', 1), { hpi: 'test' });
    assert.deepEqual(models[1].param_list, [{ name: 'patient_id', value: 1 }]);
  } finally { global.fetch = oldFetch; global.FormData = oldForm; }
});

test('AI note generation refuses empty content or a missing patient', async () => {
  const voice = loadVoice({ '@react-native-async-storage/async-storage': memoryStorage(), 'react-native': { Platform: { OS: 'ios' } } });
  await assert.rejects(voice.generateAINotes('', 1), /No transcript/);
  await assert.rejects(voice.generateAINotes('test', undefined), /No patient/);
});

test('Expo 57 rejects URI multipart parts; native transcription bypasses global fetch', async () => {
  const { convertFormDataAsync } = loadApp('node_modules/expo/src/winter/fetch/convertFormData.ts', {
    '../../utils/blobUtils': { blobToArrayBufferAsync: async (blob) => blob.arrayBuffer() },
  });
  await assert.rejects(convertFormDataAsync({ *entries() { yield ['audioFile', { uri: 'file:///clip.m4a', name: 'clip.m4a', type: 'audio/mp4' }]; } }), /Unsupported FormDataPart/);
  const oldFetch = global.fetch; const oldForm = global.FormData;
  global.FormData = Multipart;
  global.fetch = async () => { throw new Error('Expo URI upload must not run'); };
  let request;
  try {
    const voice = loadApp('app/api/voice.js', {
      '@react-native-async-storage/async-storage': memoryStorage({ token: 'test-token' }),
      'react-native': { Platform: { OS: 'ios' } },
      './axiosInstance': { async post(url, body, config) {
        request = { url, body, config };
        return { status: 200, data: { data: { data: { text: 'Recovered transcript' } } } };
      } },
    });
    assert.equal(await voice.uploadVoiceFile('file:///clip.m4a'), 'Recovered transcript');
    assert.equal(request.config.adapter, 'xhr');
    assert.equal(request.config.headers.Authorization, 'Bearer test-token');
    assert.equal(request.url, '/ai-assistant/transcribeAudio');
    assert.equal(request.body.get('audioFile').uri, 'file:///clip.m4a');
  } finally { global.fetch = oldFetch; global.FormData = oldForm; }
});

test('native AI requests distinguish expired sessions, backend failures, timeouts and offline', async () => {
  const oldForm = global.FormData; global.FormData = Multipart;
  try {
    for (const [error, expected] of [
      [{ response: { status: 401, data: {} } }, /sign in/],
      [{ response: { status: 413, data: { message: 'Recording too large' } } }, /Recording too large/],
      [{ response: { status: 500, data: '<html>Error</html>' } }, /failed \(500\)/],
      [{ code: 'ECONNABORTED' }, /timed out/],
      [new TypeError('offline'), /Unable to reach/],
    ]) {
      const voice = loadApp('app/api/voice.js', {
        '@react-native-async-storage/async-storage': memoryStorage({ token: 'test-token' }),
        'react-native': { Platform: { OS: 'ios' } },
        './axiosInstance': { post: async () => { throw error; } },
      });
      await assert.rejects(voice.uploadVoiceFile('file:///clip.m4a'), expected);
    }
  } finally { global.FormData = oldForm; }
});

test('nested save rejection and malformed notes never report success', async () => {
  let calls = 0;
  const { savePatientScribeData } = loadApp('app/api/Encounter.tsx', {
    './axiosInstance': { post: async () => { calls++; return { data: { data: { data: { success: false, message: 'Encounter rejected' } } } }; } },
  });
  await assert.rejects(savePatientScribeData({ ...scribe, notes_data: '{broken' }), /format is invalid/);
  assert.equal(calls, 0);
  await assert.rejects(savePatientScribeData(scribe), /Encounter rejected/);
});

test('invalid generated note content stops before the note editor', async () => {
  const oldForm = global.FormData; global.FormData = Multipart;
  try {
    for (const content of [42, true, '   ', [], {}]) {
      const voice = loadApp('app/api/voice.js', {
        '@react-native-async-storage/async-storage': memoryStorage({ token: 'test-token' }),
        'react-native': { Platform: { OS: 'ios' } },
        './axiosInstance': { post: async () => ({ status: 200, data: { data: { content } } }) },
      });
      await assert.rejects(voice.generateAINotes('Test transcript', 1), /No clinical notes/);
    }
  } finally { global.FormData = oldForm; }
});
