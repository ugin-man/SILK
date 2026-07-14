'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const publicDocs = ['README.md', 'README.en.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'docs/releases/v0.1.0.md'];

function markdownFilesUnder(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...markdownFilesUnder(absolute));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(absolute);
  }
  return files;
}

test('public documentation has no broken local Markdown links', () => {
  const files = [
    ...publicDocs.map(relative => path.join(root, relative)),
    ...markdownFilesUnder(path.join(root, 'examples', 'worlds', 'glass-tide'))
  ];
  const failures = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
      const rawTarget = match[1].trim().replace(/^<|>$/g, '');
      if (/^(?:https?:|mailto:|#)/i.test(rawTarget)) continue;
      const localTarget = decodeURIComponent(rawTarget.split('#')[0]);
      const resolved = path.resolve(path.dirname(file), localTarget);
      if (!fs.existsSync(resolved)) failures.push(`${path.relative(root, file)} -> ${rawTarget}`);
    }
  }
  assert.deepEqual(failures, []);
});
