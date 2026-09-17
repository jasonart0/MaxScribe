const fs = require('node:fs');
const path = require('node:path');
const BASE = 'https://ehr.maximus.care/maximuscare-ehr';
const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}
const username = process.env.MAXSCRIBE_TEST_USERNAME;
const password = process.env.MAXSCRIBE_TEST_PASSWORD;
if (!username || !password) { console.error('Set MAXSCRIBE_TEST_USERNAME and MAXSCRIBE_TEST_PASSWORD in .env.local.'); process.exit(1); }
const unwrap = (value) => {
  for (let depth = 0; depth < 4 && value && !Array.isArray(value) && 'data' in value; depth++) value = value.data;
  return value;
};
const results = [];
async function call(label, endpoint, options = {}, token) {
  const started = Date.now();
  try {
    const response = await fetch(BASE + endpoint, { ...options, headers: { Accept: 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...options.headers }, signal: AbortSignal.timeout(120000) });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    const payload = unwrap(data);
    results.push({ label, status: response.status, ms: Date.now() - started, success: data?.success !== false, format: Array.isArray(payload) ? 'array' : typeof payload, count: Array.isArray(payload) ? payload.length : undefined, keys: payload && typeof payload === 'object' && !Array.isArray(payload) ? Object.keys(payload) : undefined, recordKeys: Array.isArray(payload) && payload[0] ? Object.keys(payload[0]) : undefined });
    if (!response.ok || data?.success === false) throw new Error(label + ' failed (HTTP ' + response.status + ')');
    return payload;
  } catch (error) {
    if (!results.some((entry) => entry.label === label)) results.push({ label, error: error.name });
    throw error;
  }
}
async function main() {
  try {
    const auth = await call('login', '/auth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ app: 'EHR', client_time_stamp: require('dayjs')().format('YYYY-MM-DD HH:mm:ss.SSS'), username, password }) });
    if (!auth?.access_token) throw new Error('Login did not return a token.');
    const token = auth.access_token;
    const form = new FormData(); form.append('token', token);
    const user = await call('parse token', '/auth/token/parse', { method: 'POST', body: form }, token);
    const id = encodeURIComponent(user?.practice_id);
    const patientsBody = { param_list: [{ name: 'user_name', value: username }], criteria: '', option: 'LATEST_OPENED', pageIndex: 0, pageSize: 0 };
    const calls = await Promise.allSettled([
      call('recent patients', '/search/patient', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patientsBody) }, token),
      call('search patients', '/search/patient', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...patientsBody, param_list: [{ name: 'criteria', value: 'MaxScribe release test nonexistent patient' }], criteria: 'MaxScribe release test nonexistent patient', pageSize: 50, option: 'DEFAULT' }) }, token),
      call('places of service', '/claim/getPracticePOSList/' + id, {}, token),
      call('locations', '/lookup/getlocationList?practice_id=' + id, {}, token),
      call('providers', '/lookup/getProviderList?practice_id=' + id, {}, token),
    ]);
    const patients = calls[0].status === 'fulfilled' ? calls[0].value : [];
    if (Array.isArray(patients) && patients[0]?.name) {
      const criterion = patients[0].name.split(/[,\s]+/).find(Boolean);
      const matches = await call('search existing patient', '/search/patient', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...patientsBody, param_list: [{ name: 'criteria', value: criterion }], criteria: criterion, pageSize: 50, option: 'DEFAULT' }) }, token);
      if (!Array.isArray(matches) || !matches.some((patient) => String(patient.patient_id) === String(patients[0].patient_id))) throw new Error('Search did not return the known patient.');
    }
    const patientId = process.env.MAXSCRIBE_TEST_PATIENT_ID || (Array.isArray(patients) ? patients[0]?.patient_id : undefined);
    if (patientId != null) await call('encounter history', '/encounter/getPatientScribeData?patient_id=' + encodeURIComponent(patientId), {}, token);
    const aiForm = new FormData();
    aiForm.append('ai_request', JSON.stringify({ action: 'TRANSCRIPT_TO_CONVERSATION', data_setting: { content: 'Doctor: This is a software transcription test. Patient: I understand this is a test and no treatment is being requested.' } }));
    const conversation = await call('AI conversation (synthetic text)', '/ai-assistant/processRequest', { method: 'POST', body: aiForm }, token);
    const conversationContent = typeof conversation?.content === 'string' ? JSON.parse(conversation.content) : conversation?.content;
    const messages = typeof conversationContent?.conversation === 'string' ? JSON.parse(conversationContent.conversation) : conversationContent?.conversation;
    if (!Array.isArray(messages) || !messages.length) throw new Error('Conversation response did not contain messages.');
    if (patientId != null) {
      const noteForm = new FormData();
      noteForm.append('ai_request', JSON.stringify({ action: 'ENCOUNTER_JSON_NOTE', data_setting: { content: 'This is a software integration test. No clinical findings, diagnoses, medications or treatment are being reported. Do not infer any clinical facts.' }, param_list: [{ name: 'patient_id', value: patientId }] }));
      const notes = await call('AI clinical notes (synthetic text; not saved)', '/ai-assistant/processRequest', { method: 'POST', body: noteForm }, token);
      const content = typeof notes?.content === 'string' ? JSON.parse(notes.content) : notes?.content;
      if (!content || typeof content !== 'object' || Array.isArray(content)) throw new Error('Clinical notes did not contain a JSON object.');
      results[results.length - 1].noteKeys = Object.keys(content);
    }
    const audioPath = process.env.MAXSCRIBE_TEST_AUDIO;
    if (audioPath && fs.existsSync(audioPath)) {
      const audioForm = new FormData();
      audioForm.append('audioFile', new Blob([fs.readFileSync(audioPath)], { type: 'audio/wav' }), 'release-test.wav');
      const audio = await call('audio transcription (public speech sample)', '/ai-assistant/transcribeAudio', { method: 'POST', body: audioForm }, token);
      if (typeof audio?.text !== 'string' || !audio.text.trim()) throw new Error('Transcription returned no text.');
      results[results.length - 1].transcriptCharacters = audio.text.length;
    }
    if (calls.some((result) => result.status === 'rejected')) throw new Error('One or more patient/lookup checks failed.');
  } finally {
    fs.mkdirSync(path.join(__dirname, '..', '.expo'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, '..', '.expo', 'live-api-results.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
