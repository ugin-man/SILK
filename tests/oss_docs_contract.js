'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const commands = ['npm ci', 'npm run validate:demo', 'npm run test:v2', 'npm run audit:v2'];

test('Japanese and English READMEs expose matching public entry points', () => {
  const japanese = read('README.md');
  const english = read('README.en.md');
  for (const heading of ['SILKとは', 'V1', 'V2', '5分で試す', '公開デモ', '検証済み範囲', '未実証範囲', '貢献']) assert.match(japanese, new RegExp(`^## ${heading}$`, 'm'));
  for (const heading of ['What SILK is', 'V1', 'V2', 'Try it in five minutes', 'Public demo', 'What is verified', 'What is not yet proven', 'Contributing']) assert.match(english, new RegExp(`^## ${heading}$`, 'm'));
  for (const text of [japanese, english]) {
    for (const command of commands) assert.ok(text.includes(command), `README is missing command: ${command}`);
    for (const marker of ['examples/worlds/glass-tide', 'CONTRIBUTING.md', 'LICENSE', 'v0.1.0']) assert.ok(text.includes(marker), `README is missing link or version: ${marker}`);
  }
  assert.ok(japanese.includes('構造検証は創作品質を証明しません。'));
  assert.ok(english.includes('Structural validation does not prove creative quality.'));
});

test('contribution guide and Issue forms request reproducible evidence', () => {
  const contributing = read('CONTRIBUTING.md');
  for (const marker of ['V1 rules and validator', 'V2 application', 'Documentation', 'Human evaluation', 'OS', 'Node version', 'Expected result', 'Actual result']) assert.ok(contributing.includes(marker), `CONTRIBUTING.md is missing: ${marker}`);
  const bug = read('.github/ISSUE_TEMPLATE/bug_report.yml');
  for (const marker of ['reproduction', 'environment', 'expected', 'actual']) assert.ok(bug.includes(marker), `bug form is missing: ${marker}`);
  const proposal = read('.github/ISSUE_TEMPLATE/validation_proposal.yml');
  for (const marker of ['structure', 'creative_quality', 'long_run_autonomy', 'browser_behavior', 'evidence']) assert.ok(proposal.includes(marker), `validation form is missing: ${marker}`);
});
