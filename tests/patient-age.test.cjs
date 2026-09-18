const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app.cjs');
const { getPatientAge } = loadApp('app/lib/patientAge.ts');
const today = new Date(2026, 8, 18);

test('patient age uses the supplied value including infants aged zero', () => {
  assert.equal(getPatientAge({ age: 0 }, today), 0);
  assert.equal(getPatientAge({ age: '42' }, today), 42);
});

test('patient age falls back to DOB and respects the birthday without timezone shifts', () => {
  assert.equal(getPatientAge({ age: '', dob: '2000-09-19T00:00:00Z' }, today), 25);
  assert.equal(getPatientAge({ dob: '2000-09-18' }, today), 26);
  assert.equal(getPatientAge({ dob: '09/17/2000' }, today), 26);
});

test('missing, impossible and future dates never show an invented age', () => {
  for (const dob of [undefined, '', 'invalid', '2000-02-30', '2027-01-01']) {
    assert.equal(getPatientAge({ dob }, today), '--');
  }
});
