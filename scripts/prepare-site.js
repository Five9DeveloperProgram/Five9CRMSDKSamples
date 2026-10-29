const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
const sample = 'embedded-sample-2026.html';

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output);
fs.copyFileSync(path.join(root, sample), path.join(output, sample));
fs.copyFileSync(path.join(root, sample), path.join(output, 'index.html'));