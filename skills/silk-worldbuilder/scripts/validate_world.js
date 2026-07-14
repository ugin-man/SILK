'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

const NOTE = 'Structural validation does not prove creative quality.';
const DIMENSIONS = [
  'subject_integrity', 'depth', 'interest', 'causality', 'weave', 'breadth',
  'independence', 'anti_template', 'scope', 'naming', 'coherence', 'mystery',
  'plot_boundary', 'usability'
];
const REQUIRED_FILES = [
  'manifest.yaml', 'world.yaml', 'state.yaml', 'taxonomy.yaml',
  'subject_registry.yaml', 'relation_registry.yaml', 'claim_registry.yaml',
  'completion.yaml', 'workspace/hypothesis_pool.yaml',
  'workspace/change_set.yaml', 'workspace/expansion_queue.yaml',
  'workspace/weave_queue.yaml', 'workspace/replacement_queue.yaml',
  'workspace/non_relation_ledger.yaml', 'workspace/scope_ledger.yaml',
  'workspace/maturity_ledger.yaml', 'workspace/coverage_map.yaml',
  'workspace/pattern_ledger.yaml', 'workspace/causal_root_ledger.yaml',
  'workspace/open_questions.yaml', 'workspace/contradiction_log.md',
  'workspace/decision_log.md', 'workspace/iteration_log.md', 'views/catalog.md',
  'views/by_status.md', 'views/relation_map.md', 'views/claims.md',
  'views/comparison_matrix.md', 'reports/world_overview.md',
  'reports/shape_report.md', 'reports/interest_audit.md',
  'reports/quality_report.md', 'reports/review_packet.md'
];
const SUBJECT_KEYS = [
  'id', 'title', 'development_status', 'user_status', 'canon_authority',
  'primary_collection', 'collections', 'weight', 'maturity_level', 'scope',
  'summary', 'relation_ids', 'open_questions'
];

function finding(code, file, yamlPath, message, severity = 'error') {
  return { severity, code, file: file || null, path: yamlPath || null, message };
}

function parseDocument(text) {
  const document = YAML.parseDocument(text, { prettyErrors: true, uniqueKeys: true });
  if (document.errors.length) throw document.errors[0];
  return document.toJS();
}

function parseFrontmatter(text) {
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\s*\r?\n|$)/);
  if (!match) throw new Error('YAML frontmatter delimited by --- is required.');
  return parseDocument(match[1]);
}

function validateWorld(worldPath) {
  const root = path.resolve(worldPath);
  const findings = [];
  const documents = new Map();
  const add = (code, file, yamlPath, message, severity) => findings.push(finding(code, file, yamlPath, message, severity));
  const has = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);

  for (const relative of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(root, relative))) add('missing_file', relative, null, `Missing required file: ${relative}`);
  }
  const auditDirectory = path.join(root, 'workspace', 'audits');
  if (!fs.existsSync(auditDirectory) || !fs.statSync(auditDirectory).isDirectory()) {
    add('missing_directory', 'workspace/audits', null, 'Missing required directory: workspace/audits/');
  }

  function readYaml(relative) {
    if (documents.has(relative)) return documents.get(relative);
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) return null;
    try {
      const value = parseDocument(fs.readFileSync(absolute, 'utf8'));
      documents.set(relative, value);
      return value;
    } catch (error) {
      add('yaml_parse', relative, null, error.message);
      documents.set(relative, null);
      return null;
    }
  }

  function requireKeys(value, keys, file, basePath = null) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      add('object_required', file, basePath, `${basePath || file} must be a mapping.`);
      return;
    }
    for (const key of keys) {
      if (!has(value, key)) add('missing_key', file, basePath ? `${basePath}.${key}` : key, `Missing required key: ${key}`);
    }
  }

  const manifest = readYaml('manifest.yaml');
  const world = readYaml('world.yaml');
  const state = readYaml('state.yaml');
  const completion = readYaml('completion.yaml');
  const taxonomy = readYaml('taxonomy.yaml');
  requireKeys(manifest, ['format', 'revision', 'world_id', 'world_status', 'world_level', 'user_approval_state', 'entrypoints', 'registries'], 'manifest.yaml');
  requireKeys(world, ['world', 'title', 'intent', 'intended_appeals', 'taste_profile', 'desired_scale', 'scope_envelope', 'status', 'user_canon', 'constraints', 'exclusions', 'reversible_assumptions'], 'world.yaml');
  requireKeys(state, ['world_level', 'current_phase', 'active_packet', 'active_change_set', 'last_integrated_iteration', 'next_action', 'promotion_blockers'], 'state.yaml');
  requireKeys(completion, ['state', 'world_level', 'clean_audit_streak', 'last_audit', 'critical_gaps', 'noncritical_limitations', 'dimensions', 'evidence'], 'completion.yaml');

  if (manifest) {
    if (manifest.format !== 'silk-world-v1') add('manifest_format', 'manifest.yaml', 'format', 'format must be silk-world-v1.');
    if (manifest.revision !== 2) add('manifest_revision', 'manifest.yaml', 'revision', 'revision must be 2.');
    if (manifest.world_level !== 4) add('world_level', 'manifest.yaml', 'world_level', 'world_level must be 4.');
    const worldId = typeof world?.world === 'string' ? world.world : world?.world?.id ?? world?.world_id;
    if (!worldId || manifest.world_id !== worldId) add('world_id_mismatch', 'manifest.yaml', 'world_id', 'manifest and world world IDs must match.');
  }
  if (world && world.status !== 'internally_complete' && world.status !== 'user_approved') {
    add('world_not_complete', 'world.yaml', 'status', 'status must be internally_complete or user_approved.');
  }
  if (state) {
    if (state.world_level !== 4) add('world_level', 'state.yaml', 'world_level', 'world_level must be 4.');
    if (state.active_packet !== null) add('active_packet', 'state.yaml', 'active_packet', 'active_packet must be null.');
    if (state.active_change_set !== null) add('active_change_set', 'state.yaml', 'active_change_set', 'active_change_set must be null.');
    if (!Array.isArray(state.promotion_blockers) || state.promotion_blockers.length) add('promotion_blockers', 'state.yaml', 'promotion_blockers', 'promotion_blockers must be an empty array.');
  }
  if (completion) {
    if (completion.state !== 'internally_complete') add('completion_state', 'completion.yaml', 'state', 'state must be internally_complete.');
    if (completion.world_level !== 4) add('completion_level', 'completion.yaml', 'world_level', 'world_level must be 4.');
    if (!Number.isInteger(completion.clean_audit_streak) || completion.clean_audit_streak < 2) add('audit_streak', 'completion.yaml', 'clean_audit_streak', 'Two independent clean audits are required.');
    if (!Array.isArray(completion.critical_gaps) || completion.critical_gaps.length) add('critical_gaps', 'completion.yaml', 'critical_gaps', 'critical_gaps must be an empty array.');
    for (const dimension of DIMENSIONS) {
      if (completion.dimensions?.[dimension] !== 'pass') add('dimension_not_passed', 'completion.yaml', `dimensions.${dimension}`, `Completion dimension must pass: ${dimension}`);
      if (!Array.isArray(completion.evidence?.[dimension]) || completion.evidence[dimension].length === 0) add('missing_evidence', 'completion.yaml', `evidence.${dimension}`, `Completion evidence must be a non-empty array: ${dimension}`);
    }
  }

  const collections = taxonomy?.collections;
  if (!Array.isArray(collections) || collections.length === 0) add('empty_taxonomy', 'taxonomy.yaml', 'collections', 'At least one discovered collection is required.');
  else collections.forEach((collection, index) => {
    for (const key of ['id', 'label', 'role', 'weight', 'reason']) {
      if (typeof collection?.[key] !== 'string' || !collection[key].trim()) add('taxonomy_contract', 'taxonomy.yaml', `collections[${index}].${key}`, `Collection ${key} must be a non-empty string.`);
    }
  });

  const subjectRoot = path.join(root, 'subjects');
  const subjectFiles = [];
  if (fs.existsSync(subjectRoot)) {
    const walk = directory => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) walk(absolute);
        else if (entry.isFile() && entry.name.endsWith('.md')) subjectFiles.push(absolute);
      }
    };
    walk(subjectRoot);
  }
  const subjects = [];
  const subjectById = new Map();
  for (const absolute of subjectFiles) {
    const relative = path.relative(root, absolute).replaceAll('\\', '/');
    const discarded = relative.split('/').includes('discarded');
    let subject;
    try {
      subject = parseFrontmatter(fs.readFileSync(absolute, 'utf8'));
    } catch (error) {
      add('yaml_parse', relative, null, error.message);
      continue;
    }
    if (discarded) continue;
    requireKeys(subject, SUBJECT_KEYS, relative);
    subjects.push({ ...subject, relative });
    if (typeof subject.id === 'string' && subject.id) {
      if (subjectById.has(subject.id)) add('duplicate_subject', relative, 'id', `Duplicate canonical subject id: ${subject.id}`);
      else subjectById.set(subject.id, subject);
    }
    if (subject.weight === 'load_bearing' && subject.maturity_level !== 4) add('load_bearing_maturity', relative, 'maturity_level', 'Load-bearing subjects must reach maturity level 4.');
    if (subject.development_status === 'internally_accepted' && (!Array.isArray(subject.open_questions) || subject.open_questions.length)) add('accepted_questions', relative, 'open_questions', 'Internally accepted subjects must have no open questions.');
    if (relative.split('/').includes('approved') && !['approved', 'locked'].includes(subject.user_status)) add('approval_path', relative, 'user_status', 'Only user-approved or locked subjects may be stored under approved.');
    const body = fs.readFileSync(absolute, 'utf8');
    if (/^#{1,3}\s*(chapter\s+\d+|protagonist arc|scene sequence|quest walkthrough|story ending)\s*$/im.test(body)) add('plot_contamination', relative, null, 'Plot-like heading found in canonical subject.');
  }
  if (subjects.length === 0) add('no_subjects', 'subjects', null, 'At least one canonical subject is required.');

  const subjectRegistry = readYaml('subject_registry.yaml');
  const registrySubjects = Array.isArray(subjectRegistry?.subjects) ? subjectRegistry.subjects : [];
  const registryIds = registrySubjects.map(item => typeof item === 'string' ? item : item?.id).filter(Boolean);
  const canonicalIds = [...subjectById.keys()];
  if (new Set(registryIds).size !== registryIds.length) add('duplicate_registry_subject', 'subject_registry.yaml', 'subjects', 'Subject registry contains duplicate IDs.');
  const missingFromRegistry = canonicalIds.filter(id => !registryIds.includes(id));
  const missingFromFiles = registryIds.filter(id => !subjectById.has(id));
  if (missingFromRegistry.length || missingFromFiles.length) add('registry_subject_mismatch', 'subject_registry.yaml', 'subjects', `Registry/file mismatch. Missing from registry: ${missingFromRegistry.join(', ') || 'none'}; missing from files: ${missingFromFiles.join(', ') || 'none'}.`);

  const relationRegistry = readYaml('relation_registry.yaml');
  const relations = Array.isArray(relationRegistry?.relations) ? relationRegistry.relations : [];
  const relationIds = new Set();
  relations.forEach((relation, index) => {
    if (!relation?.id) add('missing_relation_id', 'relation_registry.yaml', `relations[${index}].id`, 'Relation ID is required.');
    else if (relationIds.has(relation.id)) add('duplicate_relation', 'relation_registry.yaml', `relations[${index}].id`, `Duplicate relation id: ${relation.id}`);
    else relationIds.add(relation.id);
    for (const field of ['source', 'target']) {
      if (!subjectById.has(relation?.[field])) add('broken_relation_subject', 'relation_registry.yaml', `relations[${index}].${field}`, `Relation references unknown subject: ${relation?.[field] ?? 'missing'}`);
    }
  });
  subjects.forEach(subject => {
    if (!Array.isArray(subject.relation_ids)) add('relation_ids_type', subject.relative, 'relation_ids', 'relation_ids must be an array.');
    else subject.relation_ids.forEach((id, index) => {
      if (!relationIds.has(id)) add('broken_relation_id', subject.relative, `relation_ids[${index}]`, `Unknown relation id: ${id}`);
    });
  });

  const claimRegistry = readYaml('claim_registry.yaml');
  const claims = Array.isArray(claimRegistry?.claims) ? claimRegistry.claims : [];
  const claimIds = new Set();
  claims.forEach((claim, index) => {
    if (!claim?.id) add('missing_claim_id', 'claim_registry.yaml', `claims[${index}].id`, 'Claim ID is required.');
    else if (claimIds.has(claim.id)) add('duplicate_claim', 'claim_registry.yaml', `claims[${index}].id`, `Duplicate claim id: ${claim.id}`);
    else claimIds.add(claim.id);
    for (const field of ['asserted_by', 'challenged_by']) {
      const ids = claim?.[field] ?? [];
      if (!Array.isArray(ids)) add('claim_subjects_type', 'claim_registry.yaml', `claims[${index}].${field}`, `${field} must be an array.`);
      else ids.forEach((id, subjectIndex) => {
        if (!subjectById.has(id)) add('broken_claim_subject', 'claim_registry.yaml', `claims[${index}].${field}[${subjectIndex}]`, `Claim references unknown subject: ${id}`);
      });
    }
  });

  function scanBlockers(value, relative, objectPath = '$') {
    if (!value || typeof value !== 'object') return;
    if (value.priority === 'critical' || value.blocks_completion === true) add('critical_queue', relative, objectPath, 'Completion-blocking work remains in a workspace queue.');
    if (Array.isArray(value)) value.forEach((child, index) => scanBlockers(child, relative, `${objectPath}[${index}]`));
    else for (const [key, child] of Object.entries(value)) scanBlockers(child, relative, `${objectPath}.${key}`);
  }
  for (const relative of REQUIRED_FILES.filter(item => item.startsWith('workspace/') && item.endsWith('.yaml'))) scanBlockers(readYaml(relative), relative);

  const qualityPath = path.join(root, 'reports', 'quality_report.md');
  if (fs.existsSync(qualityPath)) {
    const quality = fs.readFileSync(qualityPath, 'utf8');
    for (const dimension of DIMENSIONS) {
      const heading = dimension.replaceAll('_', ' ');
      if (!new RegExp(`^##\\s+${heading}\\s*$`, 'im').test(quality)) add('quality_section', 'reports/quality_report.md', null, `Quality report is missing section: ${heading}`);
    }
    if ((quality.match(/^###\s+Clean audit\b.*$/gim) || []).length < 2) add('audit_evidence', 'reports/quality_report.md', null, 'Quality report must contain two clean audit records.');
  }

  const cleanRoutes = [];
  if (fs.existsSync(auditDirectory)) {
    for (const entry of fs.readdirSync(auditDirectory, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const text = fs.readFileSync(path.join(auditDirectory, entry.name), 'utf8');
      if (!/^\s*-\s*Clean audit:\s*yes\s*$/im.test(text)) continue;
      const route = text.match(/^\s*-\s*Audit route:\s*(\S.*)\s*$/im)?.[1]?.trim();
      if (route) cleanRoutes.push(route);
    }
  }
  if (cleanRoutes.length < 2) add('clean_audit_files', 'workspace/audits', null, 'Two clean audit artifact files are required.');
  else if (new Set(cleanRoutes).size < 2) add('clean_audit_routes', 'workspace/audits', null, 'Clean audits must use two different non-empty routes.');

  return {
    valid: findings.length === 0,
    world_path: root,
    subject_count: subjects.length,
    relation_count: relations.length,
    findings,
    note: NOTE
  };
}

function formatHumanResult(result) {
  const lines = [result.valid ? `PASS: ${result.world_path}` : `FAIL: ${result.world_path}`];
  for (const item of result.findings) {
    const location = [item.file, item.path].filter(Boolean).join(':');
    lines.push(`${item.severity.toUpperCase()}: [${item.code}]${location ? ` ${location}` : ''} ${item.message}`);
  }
  lines.push(NOTE);
  return lines.join('\n');
}

module.exports = { validateWorld, formatHumanResult, parseFrontmatter };

if (require.main === module) {
  const args = process.argv.slice(2);
  const worldPath = args.find(argument => !argument.startsWith('--'));
  if (!worldPath) {
    console.error('Usage: node validate_world.js <worldPath> [--json]');
    process.exit(2);
  }
  const result = validateWorld(worldPath);
  console.log(args.includes('--json') ? JSON.stringify(result, null, 2) : formatHumanResult(result));
  process.exitCode = result.valid ? 0 : 1;
}
