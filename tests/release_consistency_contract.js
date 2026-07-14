'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { checkReleaseConsistency } = require('../scripts/release_consistency.js');

const repoRoot = path.resolve(__dirname, '..');

test('release metadata and evidence agree', () => {
  assert.deepEqual(checkReleaseConsistency(repoRoot), []);
});

test('one current workflow owns all four public checks', () => {
  const workflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8');
  for (const job of ['v1-theory:', 'v1-validator:', 'v2-contracts:', 'release-consistency:']) assert.ok(workflow.includes(job));
  assert.ok(workflow.includes('actions/checkout@v6'));
  assert.ok(workflow.includes('actions/setup-node@v6'));
  assert.equal(fs.existsSync(path.join(repoRoot, '.github/workflows/v1-ci.yml')), false);
});
