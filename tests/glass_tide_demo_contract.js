'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const YAML = require('yaml');
const { parseFrontmatter, validateWorld } = require('../skills/silk-worldbuilder/scripts/validate_world.js');

const demoRoot = path.resolve(__dirname, '../examples/worlds/glass-tide');
const read = relative => fs.readFileSync(path.join(demoRoot, relative), 'utf8');

test('Glass Tide is a complete small generated-world package', () => {
  const result = validateWorld(demoRoot);
  assert.equal(result.valid, true, JSON.stringify(result.findings, null, 2));
  assert.equal(result.subject_count, 6);
  assert.equal(result.relation_count, 5);
});

test('Glass Tide preserves execution and review evidence', () => {
  const prompt = read('PROMPT.md');
  const run = read('RUN_RECORD.md');
  const selfAudit = read('AI_SELF_AUDIT.md');
  const human = read('HUMAN_EVALUATION.md');
  assert.match(prompt, /Independent causal roots/);
  assert.match(run, /Level 0/);
  assert.match(run, /Level 4/);
  assert.match(run, /Rejected hypothesis/);
  assert.match(selfAudit, /Structural validation is not creative proof/);
  assert.match(human, /Evaluator:/);
  assert.doesNotMatch(human, /Evaluator:\s*(Codex|AI|ChatGPT)/i);
});

test('Glass Tide keeps the fixed subject, relation, and claim boundaries', () => {
  const expectedSubjects = [
    'glass-tide.phenomenon.ember-tide',
    'glass-tide.place.first-light-terraces',
    'glass-tide.institution.cooling-houses',
    'glass-tide.people.ash-divers',
    'glass-tide.route.pale-current',
    'glass-tide.place.rain-vault'
  ];
  const expectedRelations = [
    'relation.ember-tide.first-light.harvest-cycle',
    'relation.first-light.cooling-houses.civic-obligation',
    'relation.ash-divers.ember-tide.occupational-risk',
    'relation.pale-current.first-light.seasonal-access',
    'relation.ash-divers.cooling-houses.aftercare'
  ];
  const registry = YAML.parse(read('subject_registry.yaml'));
  assert.deepEqual(registry.subjects.map(item => item.id).sort(), expectedSubjects.sort());
  for (const item of registry.subjects) {
    assert.match(item.canonical_path, /^subjects\/pending\//);
    assert.equal(item.user_status, 'unreviewed');
    assert.ok(item.display && item.display.preferred_contexts.length > 0);
    if (item.weight === 'load_bearing') assert.equal(item.maturity_level, 4);
    const subject = parseFrontmatter(read(item.canonical_path));
    assert.equal(subject.id, item.id);
    assert.equal(subject.user_status, 'unreviewed');
  }
  assert.equal(fs.existsSync(path.join(demoRoot, 'subjects', 'approved')), false);

  const relations = YAML.parse(read('relation_registry.yaml')).relations;
  assert.deepEqual(relations.map(item => item.id).sort(), expectedRelations.sort());
  for (const relation of relations) {
    assert.ok(relation.summary.length > 20);
    assert.ok(relation.effects_on_source.length > 0);
    assert.ok(relation.effects_on_target.length > 0);
    assert.equal(relation.development_status, 'internally_accepted');
    assert.equal(relation.user_status, 'unreviewed');
  }

  const claims = YAML.parse(read('claim_registry.yaml')).claims;
  assert.equal(claims.length, 3);
  assert.equal(claims.find(item => item.id === 'claim.ember-tide.origin').authorial_resolution, 'unresolved');
  const rainVault = parseFrontmatter(read('subjects/pending/inland_archives/rain-vault.md'));
  assert.deepEqual(rainVault.relation_ids, []);
});
