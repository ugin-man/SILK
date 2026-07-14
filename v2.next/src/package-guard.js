(function (root, factory) {
  const exported = factory();
  if (typeof module === 'object' && module.exports) module.exports = exported;
  if (root) root.SILK_PACKAGE_GUARD = exported;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const BUDGETS = Object.freeze({
    maxFileBytes: 25 * 1024 * 1024,
    maxDepth: 32,
    maxObjects: 600000,
    maxStringLength: 2 * 1024 * 1024,
    maxSubjects: 25000,
    maxRelations: 150000,
    maxCollections: 5000,
    maxClaims: 150000,
    maxFeatures: 50000,
    maxCells: 250000
  });
  const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
  const textBytes = value => typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(value).length : Buffer.byteLength(value, 'utf8');
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const isText = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 512 && !/[\u0000-\u001f\u007f]/.test(value);
  const clone = value => JSON.parse(JSON.stringify(value));

  function inspectTree(value, errors) {
    const active = new WeakSet();
    let objects = 0;
    function visit(node, path, depth) {
      if (typeof node === 'string') {
        if (node.length > BUDGETS.maxStringLength) errors.push(`${path}: string exceeds ${BUDGETS.maxStringLength} characters`);
        return;
      }
      if (node === null || typeof node !== 'object') return;
      if (depth > BUDGETS.maxDepth) { errors.push(`${path}: nesting exceeds ${BUDGETS.maxDepth}`); return; }
      if (active.has(node)) { errors.push(`${path}: cyclic input is not supported`); return; }
      active.add(node);
      objects += 1;
      if (objects > BUDGETS.maxObjects) { errors.push(`package exceeds ${BUDGETS.maxObjects} objects`); return; }
      for (const key of Object.keys(node)) {
        if (BLOCKED_KEYS.has(key)) errors.push(`${path}.${key}: unsafe key is not allowed`);
        visit(node[key], `${path}.${key}`, depth + 1);
      }
      active.delete(node);
    }
    visit(value, '$', 0);
  }

  function uniqueIds(items, label, errors) {
    const ids = new Set();
    items.forEach((item, index) => {
      const id = item?.id;
      if (!isText(id)) errors.push(`${label}[${index}].id is required and must be a short text ID`);
      else if (ids.has(id)) errors.push(`${label}: duplicate id ${id}`);
      else ids.add(id);
    });
    return ids;
  }

  function collectionIdsFor(subject) {
    const raw = subject.collection_ids ?? subject.collectionIds ?? subject.collections ?? subject.collection_id ?? subject.collectionId;
    return (Array.isArray(raw) ? raw : raw == null ? [] : [raw]).map(String);
  }

  function geometryValid(geometry) {
    if (!isObject(geometry) || !['Point', 'LineString', 'Polygon', 'MultiPolygon', 'Topology', 'Unplaced'].includes(geometry.type)) return false;
    if (geometry.type === 'Topology' || geometry.type === 'Unplaced') return true;
    const geographic = geometry.coordinate_space === 'geographic-sphere';
    let pairs = 0;
    function visit(value) {
      if (!Array.isArray(value) || value.length === 0) return false;
      if (value.length >= 2 && value.every(Number.isFinite)) {
        pairs += 1;
        return geographic
          ? value[0] >= -180 && value[0] <= 180 && value[1] >= -90 && value[1] <= 90
          : value[0] >= 0 && value[0] <= 1 && value[1] >= 0 && value[1] <= 1;
      }
      return value.every(visit);
    }
    return visit(geometry.coordinates) && pairs > 0;
  }

  function validateCells(cells, worldId, errors) {
    if (!isObject(cells)) return;
    const terrain = cells.terrain, owners = cells.owners;
    if (!Array.isArray(terrain) || !Array.isArray(owners) || terrain.length !== owners.length || terrain.length === 0) {
      errors.push('spherical_cells terrain and owners must be non-empty arrays of equal length');
      return;
    }
    if (terrain.length > BUDGETS.maxCells) errors.push(`spherical_cells exceeds ${BUDGETS.maxCells} cells`);
    if (cells.cell_count != null && Number(cells.cell_count) !== terrain.length) errors.push('spherical_cells.cell_count does not match terrain length');
    if (cells.world_id && cells.world_id !== worldId) errors.push('spherical_cells.world_id does not match package world_id');
    if (!Array.isArray(cells.countries) || !Array.isArray(cells.settlements ?? [])) errors.push('spherical_cells countries and settlements must be arrays');
    const countryCount = Array.isArray(cells.countries) ? cells.countries.length : 0;
    owners.forEach((owner, index) => {
      if (!Number.isInteger(owner) || owner < -1 || owner >= countryCount) errors.push(`spherical_cells.owners[${index}] is out of range`);
    });
  }

  function validateWorldPackage(input) {
    const errors = [], warnings = [];
    if (!isObject(input)) return { ok: false, errors: ['package must be an object'], warnings };
    inspectTree(input, errors);
    if (input.format !== 'silk-v2-world-package') errors.push('format must be silk-v2-world-package');
    if (!/^2(?:\.|$)/.test(String(input.version ?? ''))) errors.push('version must be a SILK V2 package version');
    if (!isText(input.world_id)) errors.push('world_id is required');
    if (!isObject(input.meta) || !isText(input.meta.id) || !isText(input.meta.title)) errors.push('meta.id and meta.title are required');
    if (input.meta?.id && input.world_id && input.meta.id !== input.world_id) errors.push('meta.id must match world_id');
    if (!isObject(input.world) || !isText(input.world.id) || !isText(input.world.title)) errors.push('world.id and world.title are required');
    if (input.world?.id && input.world_id && input.world.id !== input.world_id) errors.push('world.id must match world_id');
    for (const [key, limit] of [['collections', BUDGETS.maxCollections], ['subjects', BUDGETS.maxSubjects], ['relations', BUDGETS.maxRelations]]) {
      if (!Array.isArray(input[key])) errors.push(`${key} must be an array`);
      else if (input[key].length > limit) errors.push(`${key} exceeds ${limit}`);
    }
    for (const [key, limit] of [['claims', BUDGETS.maxClaims], ['features', BUDGETS.maxFeatures], ['layers', BUDGETS.maxCollections], ['snapshots', BUDGETS.maxCollections]]) {
      if (input[key] != null && !Array.isArray(input[key])) errors.push(`${key} must be an array when present`);
      else if (input[key]?.length > limit) errors.push(`${key} exceeds ${limit}`);
    }
    if (input.validation?.ok !== true || (input.validation?.errors?.length ?? 0) > 0) errors.push('package validation must be ok with no errors');

    const collections = Array.isArray(input.collections) ? input.collections : [];
    const subjects = Array.isArray(input.subjects) ? input.subjects : [];
    const relations = Array.isArray(input.relations) ? input.relations : [];
    const claims = Array.isArray(input.claims) ? input.claims : [];
    const collectionIds = uniqueIds(collections, 'collections', errors);
    const subjectIds = uniqueIds(subjects, 'subjects', errors);
    uniqueIds(relations, 'relations', errors);
    uniqueIds(claims, 'claims', errors);
    if (subjects.length === 0) errors.push('subjects must contain at least one world subject');
    subjects.forEach((subject, index) => {
      if (!isText(subject?.name)) errors.push(`subjects[${index}].name is required`);
      if (!isText(subject?.kind)) errors.push(`subjects[${index}].kind is required`);
      const ids = collectionIdsFor(subject);
      if (ids.length === 0) errors.push(`subjects[${index}] must belong to a collection`);
      ids.forEach(id => { if (!collectionIds.has(id)) errors.push(`subjects[${index}] references missing collection ${id}`); });
      const importance = Number(subject?.display?.importance ?? subject?.importance ?? 50);
      const tier = Number(subject?.display?.visibility_tier ?? subject?.display?.visibilityTier ?? 2);
      if (!Number.isFinite(importance) || importance < 0 || importance > 100) errors.push(`subjects[${index}] importance must be 0..100`);
      if (!Number.isInteger(tier) || tier < 0 || tier > 4) errors.push(`subjects[${index}] visibility_tier must be 0..4`);
    });
    relations.forEach((relation, index) => {
      if (!subjectIds.has(relation?.source)) errors.push(`relations[${index}] references missing source ${relation?.source}`);
      if (!subjectIds.has(relation?.target)) errors.push(`relations[${index}] references missing target ${relation?.target}`);
      if (relation?.source === relation?.target) errors.push(`relations[${index}] cannot connect a subject to itself`);
      if (!isText(relation?.kind ?? relation?.label)) errors.push(`relations[${index}].kind is required`);
    });
    claims.forEach((claim, index) => {
      const subjectId = claim?.subject_id ?? claim?.subjectId ?? claim?.subject ?? claim?.about;
      if (!subjectIds.has(subjectId)) errors.push(`claims[${index}] references missing subject ${subjectId}`);
    });

    const registry = input.spatial_registry;
    if (registry != null) {
      if (!isObject(registry) || !Array.isArray(registry.features)) errors.push('spatial_registry.features must be an array');
      else {
        if (registry.world_id && registry.world_id !== input.world_id) errors.push('spatial_registry.world_id must match world_id');
        if (registry.features.length > BUDGETS.maxFeatures) errors.push(`spatial_registry.features exceeds ${BUDGETS.maxFeatures}`);
        uniqueIds(registry.features, 'spatial_registry.features', errors);
        registry.features.forEach((feature, index) => {
          const subjectId = feature?.subject_id ?? feature?.subjectId;
          if (subjectId && !subjectIds.has(subjectId)) errors.push(`spatial_registry.features[${index}] references missing subject ${subjectId}`);
          if (!geometryValid(feature?.geometry)) errors.push(`spatial_registry.features[${index}].geometry is invalid`);
        });
      }
    }
    validateCells(input.spherical_cells ?? input.world?.spherical_cells, input.world_id, errors);
    const integration = input.integration;
    if (!isObject(integration) || !isObject(integration.renderer)) errors.push('integration.renderer is required');
    if (Number.isFinite(integration?.subject_count) && integration.subject_count !== subjects.length) errors.push('integration.subject_count is stale');
    if (Number.isFinite(integration?.relation_count) && integration.relation_count !== relations.length) errors.push('integration.relation_count is stale');
    if (Number.isFinite(integration?.spatial_feature_count) && integration.spatial_feature_count !== (registry?.features?.length ?? 0)) errors.push('integration.spatial_feature_count is stale');
    if (errors.length) return { ok: false, errors: [...new Set(errors)].slice(0, 200), warnings };
    return { ok: true, errors: [], warnings, value: clone(input) };
  }

  function parseWorldPackage(text) {
    const source = String(text ?? '');
    if (textBytes(source) > BUDGETS.maxFileBytes) return { ok: false, errors: [`file exceeds ${BUDGETS.maxFileBytes} bytes`], warnings: [] };
    let parsed;
    try { parsed = JSON.parse(source); }
    catch (error) { return { ok: false, errors: [`invalid JSON: ${error.message}`], warnings: [] }; }
    return validateWorldPackage(parsed);
  }

  return Object.freeze({ version: '2.0.0', BUDGETS, validateWorldPackage, parseWorldPackage, geometryValid });
});
