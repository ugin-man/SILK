'use strict';

const assert = require('assert');
const path = require('path');
const Guard = require(path.resolve(__dirname, '../src/package-guard.js'));

function fixture() {
  return {
    format: 'silk-v2-world-package', version: '2.0.0', world_id: 'fixture_world',
    meta: { id: 'fixture_world', title: 'Fixture' },
    world: { id: 'fixture_world', title: 'Fixture', summary: 'A valid fixture.' },
    collections: [{ id: 'overview', label: 'Overview', description: 'Root' }],
    subjects: [{
      id: 'world.fixture', collection_id: 'overview', name: 'Fixture', kind: 'world',
      status: 'pending', summary: 'A valid fixture.', body_markdown: '## Fixture',
      display: { importance: 100, visibility_tier: 0 }
    }],
    relations: [], claims: [], features: [], layers: [],
    snapshots: [{ id: 'now', year: 0, label: 'Now', short: 'NOW' }],
    spaceModel: { type: 'planetary', status: 'ready' },
    rendererProfile: { primary: 'atlas', fallback: null },
    spatial_registry: { format: 'silk-spatial-registry-v1', world_id: 'fixture_world', features: [], layers: [], snapshots: [] },
    integration: { renderer: { space_type: 'planetary', primary: 'atlas', map_enabled: false, fallback: null }, subject_count: 1, relation_count: 0, spatial_feature_count: 0 },
    validation: { ok: true, errors: [] }
  };
}

const valid = Guard.validateWorldPackage(fixture());
assert.strictEqual(valid.ok, true, valid.errors?.join('\n'));
assert.notStrictEqual(valid.value, fixture(), 'guard must return an isolated clone');

const duplicate = fixture();
duplicate.subjects.push({ ...duplicate.subjects[0] });
duplicate.integration.subject_count = 2;
assert.strictEqual(Guard.validateWorldPackage(duplicate).ok, false, 'duplicate subject IDs must fail');

const dangling = fixture();
dangling.relations.push({ id: 'r1', source: 'world.fixture', target: 'missing', kind: 'contains', label: 'contains' });
dangling.integration.relation_count = 1;
assert.strictEqual(Guard.validateWorldPackage(dangling).ok, false, 'dangling relation endpoints must fail');

const brokenGeometry = fixture();
brokenGeometry.rendererProfile.primary = 'globe';
brokenGeometry.integration.renderer = { space_type: 'planetary', primary: 'globe', map_enabled: true, fallback: null };
brokenGeometry.spatial_registry.features.push({ id: 'bad', subject_id: 'world.fixture', geometry: { type: 'Polygon', coordinates: [] } });
brokenGeometry.integration.spatial_feature_count = 1;
assert.strictEqual(Guard.validateWorldPackage(brokenGeometry).ok, false, 'invalid geography must fail before renderers mutate');

const staleCounts = fixture();
staleCounts.integration.subject_count = 99;
assert.strictEqual(Guard.validateWorldPackage(staleCounts).ok, false, 'stale integration counts must fail');

const dangerous = JSON.parse(JSON.stringify(fixture()).replace('"meta":{', '"__proto__":{"polluted":true},"meta":{'));
assert.strictEqual(Guard.validateWorldPackage(dangerous).ok, false, 'prototype-pollution keys must fail');
assert.strictEqual({}.polluted, undefined);

const parsed = Guard.parseWorldPackage(JSON.stringify(fixture()));
assert.strictEqual(parsed.ok, true);
assert.strictEqual(parsed.value.world_id, 'fixture_world');
assert.strictEqual(Guard.parseWorldPackage('{broken').ok, false, 'invalid JSON must fail cleanly');

console.log('package_guard_contract: ok');
