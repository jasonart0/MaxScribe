const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load-app.cjs');
const helpers = () => loadApp('app/lib/helper.tsx', { './utils': { isNotEmpty: (value) => value != null && value !== '' && !(typeof value === 'object' && Object.keys(value).length === 0) } });

test('clinical editing preserves hidden codes and unknown backend fields', () => {
  const { sectionsToApiResponse } = helpers();
  const previous = { allergies: [{ description: 'Before', snomed_ct: '123', extra: 'keep' }], session_id: 'keep-session' };
  const result = sectionsToApiResponse([{ key: 'allergies', data: [{ description: 'After' }] }], previous);
  assert.deepEqual(result, { allergies: [{ description: 'After', snomed_ct: '123', extra: 'keep' }], session_id: 'keep-session' });
  assert.equal(previous.allergies[0].description, 'Before');
});

test('new backend assessment_plan notes and text summaries are visible', () => {
  const { sectionConfig } = helpers();
  const sections = sectionConfig({ assessment_plan: [{ description: 'Test assessment' }], text: 'Test summary' });
  assert.equal(sections.find((section) => section.key === 'assessment_plan').hasData, true);
  assert.equal(sections.find((section) => section.key === 'text').hasData, true);
});

test('plain and object clinical sections round-trip to the original schema', () => {
  const { sectionConfig, sectionsToApiResponse } = helpers();
  const note = { hpi: 'Test history', social_lifestyle: { alcohol_use: 'none' }, follow_up: [{ text: 'Test followup', period: 'days', when: '1' }] };
  const result = sectionsToApiResponse(sectionConfig(note), note);
  for (const key of Object.keys(note)) assert.deepEqual(result[key], note[key]);
});
