'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const next = path.resolve(__dirname, '..');
const candidate = fs.readFileSync(path.join(next, 'SILK-V2.html'));
const evidencePath = path.join(next, 'BROWSER_VALIDATION.json');
assert(fs.existsSync(evidencePath), 'external browser validation evidence is missing');
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
const sha256 = crypto.createHash('sha256').update(candidate).digest('hex').toUpperCase();

assert.strictEqual(evidence.status, 'PASS');
assert.strictEqual(evidence.candidate_sha256, sha256, 'browser evidence is stale for the current candidate');
assert.strictEqual(evidence.console_errors, 0);
assert.strictEqual(evidence.console_warnings, 0);
for (const check of [
  'plain_identity',
  'one_starter_subject',
  'zero_relations',
  'zero_countries',
  'zero_settlements',
  'all_cells_ocean',
  'all_cells_unowned',
  'webgl2_renderer',
  'surface_white_roundtrip',
  'terrain_edit_and_undo',
  'auto_rotate_stops_on_interaction',
  'atlas_starter_node',
  'reader_starter_article',
  'secret_loom_trigger',
  'secret_loom_functional_copy',
  'world_exits_secret_loom',
  'atlas_exits_secret_loom',
  'visual_layout_review'
  ,'strict_package_validation'
  ,'atomic_import_rollback'
  ,'spatial_package_import'
  ,'visible_import_error'
  ,'xss_text_only'
  ,'export_roundtrip'
  ,'dirty_state'
  ,'mobile_world'
  ,'mobile_atlas_reader'
  ,'keyboard_world'
  ,'offline_single_file'
  ,'no_horizontal_overflow'
  ,'accessibility_audit'
  ,'reduced_motion'
]) {
  assert.strictEqual(evidence.checks?.[check], true, `browser check missing or failed: ${check}`);
}

console.log('browser_evidence_contract: ok');
