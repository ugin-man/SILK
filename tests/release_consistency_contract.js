'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { checkReleaseConsistency } = require('../scripts/release_consistency.js');

const repoRoot = path.resolve(__dirname, '..');

test('release metadata and evidence agree', () => {
  assert.deepEqual(checkReleaseConsistency(repoRoot), []);
});
