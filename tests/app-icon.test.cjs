const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appIcon = path.resolve(
  __dirname,
  '..',
  'ios',
  'MaxScribe',
  'Images.xcassets',
  'AppIcon.appiconset',
  'App-Icon-1024x1024@1x.png',
);

test('iOS marketing icon is 1024px and has no alpha channel', () => {
  const png = fs.readFileSync(appIcon);

  assert.deepEqual(
    [...png.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
    'app icon must be a PNG',
  );
  assert.equal(png.readUInt32BE(16), 1024, 'app icon width must be 1024px');
  assert.equal(png.readUInt32BE(20), 1024, 'app icon height must be 1024px');

  const colorType = png[25];
  assert.ok(
    colorType === 0 || colorType === 2,
    `app icon PNG must not contain alpha; found PNG color type ${colorType}`,
  );
});
