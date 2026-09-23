const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app.cjs');

const { getScheduledEncounterDefaults, findLookupById } = loadApp('app/lib/scheduledEncounter.ts');

test('scheduled encounter defaults support flat and nested appointment payloads', () => {
  assert.deepEqual(getScheduledEncounterDefaults({ provider_id: 12, location_id: '34' }), {
    providerId: '12', locationId: '34',
  });
  assert.deepEqual(getScheduledEncounterDefaults({ appointment: { provider: { id: 56 }, location: { id: 78 } } }), {
    providerId: '56', locationId: '78',
  });
  assert.deepEqual(getScheduledEncounterDefaults({ app_provider_name: 'Dr Test', app_location_name: 'Main Clinic' }), {
    providerName: 'Dr Test', locationName: 'Main Clinic',
  });
});

test('scheduled IDs match the raw lookup values used by dropdowns', () => {
  const items = [{ label: 'Doctor', value: { provider_id: 12 } }];
  assert.equal(findLookupById(items, '12', ['provider_id']), items[0]);
  assert.equal(findLookupById(items, '99', ['provider_id']), null);
});

test('scheduled names match practice lookups case-insensitively', () => {
  const { findLookupByName } = loadApp('app/lib/scheduledEncounter.ts');
  const items = [{ label: 'Dr Test', value: { id: 12, name: 'Dr Test' } }];
  assert.equal(findLookupByName(items, '  dr TEST ', ['provider_name']), items[0]);
});
