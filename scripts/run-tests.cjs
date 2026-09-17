const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const tests = fs.readdirSync(path.join(root, 'tests')).filter((file) => file.endsWith('.test.cjs')).map((file) => path.join(root, 'tests', file));
const result = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...tests], { cwd: root, stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
