'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const { validateWorld } = require('../skills/silk-worldbuilder/scripts/validate_world.js');

const dimensions = [
  'subject_integrity', 'depth', 'interest', 'causality', 'weave', 'breadth',
  'independence', 'anti_template', 'scope', 'naming', 'coherence', 'mystery',
  'plot_boundary', 'usability'
];

const requiredTextFiles = [
  'workspace/contradiction_log.md', 'workspace/decision_log.md',
  'workspace/iteration_log.md', 'views/catalog.md', 'views/by_status.md',
  'views/relation_map.md', 'views/claims.md', 'views/comparison_matrix.md',
  'reports/world_overview.md', 'reports/shape_report.md',
  'reports/interest_audit.md', 'reports/review_packet.md'
];

function writeFile(world, relative, contents) {
  const target = path.join(world, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents, 'utf8');
}

function writeYaml(world, relative, value) {
  writeFile(world, relative, `${JSON.stringify(value, null, 2)}\n`);
}

function subjectText(overrides = {}) {
  const value = {
    id: 'glass-tide.place.first-light',
    title: 'First Light: Terraces',
    development_status: 'internally_accepted',
    user_status: 'unreviewed',
    canon_authority: 'internal',
    primary_collection: 'places',
    collections: ['places', 'settlements'],
    weight: 'load_bearing',
    maturity_level: 4,
    scope: 'local',
    relation_ids: ['relation.glass-tide.first-light-to-tide'],
    open_questions: [],
    ...overrides
  };
  const list = key => `[${value[key].map(item => JSON.stringify(item)).join(', ')}]`;
  return `---\nid: ${value.id}\ntitle: ${JSON.stringify(value.title)}\ndevelopment_status: ${value.development_status}\nuser_status: ${value.user_status}\ncanon_authority: ${value.canon_authority}\nprimary_collection: ${value.primary_collection}\ncollections: ${list('collections')}\nweight: ${value.weight}\nmaturity_level: ${value.maturity_level}\nscope: ${value.scope}\nsummary: |\n  Glass workers read the tidal glow.\n  Their terraces cool before dawn.\nrelation_ids: ${list('relation_ids')}\nopen_questions: ${list('open_questions')}\n---\n\n# ${value.title}\n\nA canonical subject.\n`;
}

function writeSubject(world, relative, overrides = {}) {
  writeFile(world, relative, subjectText(overrides));
}

function makeValidWorld() {
  const world = fs.mkdtempSync(path.join(os.tmpdir(), 'silk-v1-'));
  const worldId = 'glass-tide';
  const evidence = Object.fromEntries(dimensions.map(name => [name, [`reports/quality_report.md#${name}`]]));
  const dimensionResults = Object.fromEntries(dimensions.map(name => [name, 'pass']));

  writeYaml(world, 'manifest.yaml', {
    format: 'silk-world-v1', revision: 2, world_id: worldId,
    world_status: 'internally_complete', world_level: 4,
    user_approval_state: 'unreviewed', entrypoints: {}, registries: {}
  });
  writeYaml(world, 'world.yaml', {
    world: { id: worldId }, title: 'Glass Tide', intent: 'A littoral world',
    intended_appeals: ['systems'], taste_profile: ['austere'], desired_scale: 'small',
    scope_envelope: ['one coast'], status: 'internally_complete', user_canon: [],
    constraints: [], exclusions: [], reversible_assumptions: []
  });
  writeYaml(world, 'state.yaml', {
    world_level: 4, current_phase: 'complete', active_packet: null,
    active_change_set: null, last_integrated_iteration: 3, next_action: 'human_review',
    promotion_blockers: []
  });
  writeYaml(world, 'taxonomy.yaml', {
    collections: [{ id: 'places', label: 'Places', role: 'spatial', weight: 'load_bearing', reason: 'Anchors the coast' }]
  });
  writeYaml(world, 'subject_registry.yaml', {
    subjects: [{ id: 'glass-tide.place.first-light', path: 'subjects/pending/places/first-light.md' }]
  });
  writeYaml(world, 'relation_registry.yaml', {
    relations: [{
      id: 'relation.glass-tide.first-light-to-tide',
      source: 'glass-tide.place.first-light', target: 'glass-tide.place.first-light',
      type: 'depends_on', summary: 'The terraces follow the tide.',
      effects_on_source: [], effects_on_target: [], scope: 'local',
      development_status: 'working', user_status: 'unreviewed'
    }],
    junctions: []
  });
  writeYaml(world, 'claim_registry.yaml', {
    claims: [{ id: 'claim.glass-tide.cooling', statement: 'Cooling follows the tide.', asserted_by: ['glass-tide.place.first-light'], challenged_by: [] }]
  });
  writeYaml(world, 'completion.yaml', {
    state: 'internally_complete', world_level: 4, clean_audit_streak: 2,
    last_audit: 'audit-route-b', critical_gaps: [], noncritical_limitations: ['Human review pending'],
    dimensions: dimensionResults, evidence
  });

  for (const queue of ['hypothesis_pool', 'change_set', 'expansion_queue', 'weave_queue', 'replacement_queue', 'non_relation_ledger', 'scope_ledger', 'maturity_ledger', 'coverage_map', 'pattern_ledger', 'causal_root_ledger', 'open_questions']) {
    writeYaml(world, `workspace/${queue}.yaml`, { items: [] });
  }
  for (const relative of requiredTextFiles) writeFile(world, relative, '# Evidence\n');
  const qualitySections = dimensions.map(name => `## ${name.replaceAll('_', ' ')}\n\nPass.\n`).join('\n');
  writeFile(world, 'reports/quality_report.md', `# Quality report\n\n${qualitySections}\n### Clean audit route-a\n\nPass.\n\n### Clean audit route-b\n\nPass.\n`);
  writeFile(world, 'workspace/audits/route-a.md', '# Audit A\n\n- Audit route: structural\n- Clean audit: yes\n');
  writeFile(world, 'workspace/audits/route-b.md', '# Audit B\n\n- Audit route: adversarial\n- Clean audit: yes\n');
  writeSubject(world, 'subjects/pending/places/first-light.md');
  return world;
}

test('accepts quoted scalars, inline arrays, and block scalars', () => {
  const result = validateWorld(makeValidWorld());
  assert.equal(result.valid, true, JSON.stringify(result.findings, null, 2));
});

test('rejects invalid YAML with a file-scoped finding', () => {
  const world = makeValidWorld();
  writeFile(world, 'completion.yaml', 'state: [broken');
  const result = validateWorld(world);
  assert.equal(result.valid, false);
  assert.ok(result.findings.some(item => item.code === 'yaml_parse' && item.file === 'completion.yaml'));
});

test('rejects duplicate YAML keys and keeps a uniform finding shape', () => {
  const world = makeValidWorld();
  writeFile(world, 'state.yaml', 'world_level: 4\nworld_level: 3\n');
  const result = validateWorld(world);
  const parseFinding = result.findings.find(item => item.code === 'yaml_parse' && item.file === 'state.yaml');
  assert.ok(parseFinding);
  assert.deepEqual(Object.keys(parseFinding), ['severity', 'code', 'file', 'path', 'message']);
});

test('rejects duplicate subject ids', () => {
  const world = makeValidWorld();
  writeSubject(world, 'subjects/pending/places/duplicate.md');
  const result = validateWorld(world);
  assert.ok(result.findings.some(item => item.code === 'duplicate_subject'));
});

test('rejects broken relation subjects and relation ids', () => {
  const world = makeValidWorld();
  writeYaml(world, 'relation_registry.yaml', { relations: [{ id: 'relation.broken', source: 'missing.subject', target: 'glass-tide.place.first-light' }], junctions: [] });
  const result = validateWorld(world);
  assert.ok(result.findings.some(item => item.code === 'broken_relation_subject'));
  assert.ok(result.findings.some(item => item.code === 'broken_relation_id'));
});

test('rejects unapproved subjects stored under approved', () => {
  const world = makeValidWorld();
  writeSubject(world, 'subjects/approved/places/unapproved.md', { id: 'glass-tide.place.unapproved', user_status: 'unreviewed', weight: 'supporting', relation_ids: [] });
  const result = validateWorld(world);
  assert.ok(result.findings.some(item => item.code === 'approval_path'));
});

test('rejects registry drift, duplicate relations, and broken claim provenance', () => {
  const world = makeValidWorld();
  writeYaml(world, 'subject_registry.yaml', { subjects: [] });
  const duplicate = { id: 'relation.duplicate', source: 'glass-tide.place.first-light', target: 'glass-tide.place.first-light' };
  writeYaml(world, 'relation_registry.yaml', { relations: [duplicate, duplicate], junctions: [] });
  writeYaml(world, 'claim_registry.yaml', { claims: [{ id: 'claim.broken', asserted_by: ['missing.subject'], challenged_by: [] }] });
  const result = validateWorld(world);
  assert.ok(result.findings.some(item => item.code === 'registry_subject_mismatch'));
  assert.ok(result.findings.some(item => item.code === 'duplicate_relation'));
  assert.ok(result.findings.some(item => item.code === 'broken_claim_subject'));
});

test('rejects nested completion blockers and non-independent clean audits', () => {
  const world = makeValidWorld();
  writeYaml(world, 'workspace/expansion_queue.yaml', { groups: [{ items: [{ priority: 'critical' }] }] });
  writeFile(world, 'workspace/audits/route-b.md', '# Audit B\n\n- Audit route: structural\n- Clean audit: yes\n');
  const result = validateWorld(world);
  assert.ok(result.findings.some(item => item.code === 'critical_queue'));
  assert.ok(result.findings.some(item => item.code === 'clean_audit_routes'));
});

test('CLI returns machine-readable validation results', () => {
  const world = makeValidWorld();
  const validator = path.resolve(__dirname, '../skills/silk-worldbuilder/scripts/validate_world.js');
  const run = spawnSync(process.execPath, [validator, world, '--json'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const result = JSON.parse(run.stdout);
  assert.equal(result.valid, true);
  assert.equal(result.subject_count, 1);
  assert.equal(result.note, 'Structural validation does not prove creative quality.');
});

module.exports = { makeValidWorld, writeYaml, writeSubject };
