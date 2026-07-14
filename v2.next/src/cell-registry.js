(function (root, factory) {
  const exported = factory();
  if (typeof module === 'object' && module.exports) module.exports = exported;
  if (root && root.document) root.SILK_CELL_REGISTRY = exported;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const clone = (value) => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  const terrainNames = new Set(['ocean', 'sea', 'water', 'grassland', 'plains', 'forest', 'desert', 'mountain', 'snow', 'glacier', 'wetland', 'volcanic', 'tundra']);
  const isLand = (data, index) => {
    const raw = data.terrain[index], semantic = data.terrain_legend?.[raw] ?? data.terrain_legend?.[String(raw)] ?? raw;
    if (typeof semantic === 'string' && Number.isNaN(Number(semantic))) return !['ocean', 'sea', 'water'].includes(semantic.toLowerCase());
    if (Number(data.owners[index]) >= 0) return true;
    return Number(semantic) > 1;
  };

  function rebuildDerived(data, grid) {
    const countries = data.countries || [];
    countries.forEach((country, owner) => {
      const cells = grid.cells.filter((_, index) => data.owners[index] === owner);
      country.cells = cells.length;
      if (cells.length) {
        const sum = cells.reduce((acc, cell) => [acc[0] + cell.center[0], acc[1] + cell.center[1], acc[2] + cell.center[2]], [0, 0, 0]);
        const magnitude = Math.hypot(...sum) || 1; country.point = sum.map((value) => value / magnitude);
      }
    });
    const layoutById = new Map((data.country_label_layout || []).map((item) => [item.id, item]));
    data.country_label_layout = countries.map((country) => ({
      ...(layoutById.get(country.id) || {}), id: country.id,
      short_name: layoutById.get(country.id)?.short_name || country.name,
      anchor: country.point, cell_count: country.cells,
      priority: Math.min(100, 50 + Number(country.cells || 0))
    }));
    data.borders = (grid.dualEdges || []).flatMap((edge) => {
      const a = edge.cells[0], b = edge.cells[1];
      const left = data.owners[a], right = data.owners[b];
      const leftLand = isLand(data, a), rightLand = isLand(data, b);
      if (!leftLand && !rightLand) return [];
      if (left === right && leftLand === rightLand) return [];
      return [{ a: grid.faceCenters[edge.faces[0]], b: grid.faceCenters[edge.faces[1]], left, right, kind: leftLand && rightLand ? 'frontier' : 'coast', elevation: Math.max(Number(data.relief?.elevation?.[a] || 0), Number(data.relief?.elevation?.[b] || 0)) }];
    });
    return data;
  }

  function createCellRegistryStore(initialData, grid, onChange) {
    let data = rebuildDerived(clone(initialData), grid);
    let revision = 0;
    const history = [], future = [];
    const listeners = new Set();
    if (typeof onChange === 'function') listeners.add(onChange);
    const emit = (kind) => listeners.forEach((listener) => listener({ kind, revision, data }));
    const operationsOf = (transaction) => Array.isArray(transaction?.operations) ? transaction.operations : [transaction];
    const cellsValid = (cells) => Array.isArray(cells) && cells.length > 0 && cells.every((cell) => Number.isInteger(cell) && cell >= 0 && cell < grid.cells.length);
    function validateData(candidate) {
      const errors = [];
      if (!candidate || typeof candidate !== 'object') errors.push('registry must be an object');
      if (!Array.isArray(candidate?.terrain) || candidate.terrain.length !== grid.cells.length) errors.push('terrain length must equal grid cell count');
      if (!Array.isArray(candidate?.owners) || candidate.owners.length !== grid.cells.length) errors.push('owners length must equal grid cell count');
      if (!Array.isArray(candidate?.countries)) errors.push('countries must be an array');
      if (Array.isArray(candidate?.owners) && Array.isArray(candidate?.countries) && candidate.owners.some((owner) => !Number.isInteger(owner) || owner < -1 || owner >= candidate.countries.length)) errors.push('owner index is out of range');
      if (candidate?.relief?.elevation && (!Array.isArray(candidate.relief.elevation) || candidate.relief.elevation.length !== grid.cells.length)) errors.push('relief elevation length must equal grid cell count');
      if (candidate?.settlements && !Array.isArray(candidate.settlements)) errors.push('settlements must be an array');
      return { ok: errors.length === 0, errors };
    }

    function validate(transaction) {
      const errors = [];
      for (const operation of operationsOf(transaction)) {
        if (!operation || typeof operation !== 'object') { errors.push('operation must be an object'); continue; }
        if (operation.type === 'assign_owner' && (!cellsValid(operation.cells) || !Number.isInteger(operation.owner) || operation.owner < -1 || operation.owner >= data.countries.length)) errors.push('invalid assign_owner');
        else if (operation.type === 'set_terrain' && (!cellsValid(operation.cells) || !(Number.isFinite(Number(operation.terrain)) || terrainNames.has(String(operation.terrain).toLowerCase())))) errors.push('invalid set_terrain');
        else if (operation.type === 'set_cell' && (!cellsValid(operation.cells) || !Number.isInteger(operation.owner) || operation.owner < -1 || operation.owner >= data.countries.length || !(Number.isFinite(Number(operation.terrain)) || terrainNames.has(String(operation.terrain).toLowerCase())))) errors.push('invalid set_cell');
        else if (operation.type === 'upsert_settlement' && (!operation.settlement?.id || !Array.isArray(operation.settlement?.point) || operation.settlement.point.length < 3)) errors.push('invalid upsert_settlement');
        else if (operation.type === 'remove_settlement' && !operation.id) errors.push('invalid remove_settlement');
        else if (!['assign_owner', 'set_terrain', 'set_cell', 'upsert_settlement', 'remove_settlement', 'restore_owner', 'restore_terrain', 'restore_settlement'].includes(operation.type)) errors.push(`unsupported operation: ${operation.type}`);
      }
      return { ok: errors.length === 0, errors };
    }

    function applyOperations(operations) {
      const inverse = [];
      for (const operation of operations) {
        if (operation.type === 'assign_owner' || operation.type === 'set_cell') {
          inverse.unshift({ type: 'restore_owner', values: operation.cells.map((cell) => [cell, data.owners[cell]]) });
          operation.cells.forEach((cell) => { data.owners[cell] = operation.owner; });
        }
        if (operation.type === 'set_terrain' || operation.type === 'set_cell') {
          inverse.unshift({ type: 'restore_terrain', values: operation.cells.map((cell) => [cell, data.terrain[cell]]) });
          operation.cells.forEach((cell) => { data.terrain[cell] = Number.isFinite(Number(operation.terrain)) ? Number(operation.terrain) : String(operation.terrain).toLowerCase(); });
        }
        if (operation.type === 'restore_owner') {
          inverse.unshift({ type: 'restore_owner', values: operation.values.map(([cell]) => [cell, data.owners[cell]]) });
          operation.values.forEach(([cell, value]) => { data.owners[cell] = value; });
        }
        if (operation.type === 'restore_terrain') {
          inverse.unshift({ type: 'restore_terrain', values: operation.values.map(([cell]) => [cell, data.terrain[cell]]) });
          operation.values.forEach(([cell, value]) => { data.terrain[cell] = value; });
        }
        if (operation.type === 'upsert_settlement') {
          const index = data.settlements.findIndex((item) => item.id === operation.settlement.id);
          inverse.unshift({ type: 'restore_settlement', id: operation.settlement.id, value: index >= 0 ? clone(data.settlements[index]) : null });
          if (index >= 0) data.settlements[index] = clone(operation.settlement); else data.settlements.push(clone(operation.settlement));
        }
        if (operation.type === 'remove_settlement') {
          const index = data.settlements.findIndex((item) => item.id === operation.id);
          inverse.unshift({ type: 'restore_settlement', id: operation.id, value: index >= 0 ? clone(data.settlements[index]) : null });
          if (index >= 0) data.settlements.splice(index, 1);
        }
        if (operation.type === 'restore_settlement') {
          const index = data.settlements.findIndex((item) => item.id === operation.id);
          inverse.unshift({ type: 'restore_settlement', id: operation.id, value: index >= 0 ? clone(data.settlements[index]) : null });
          if (operation.value == null && index >= 0) data.settlements.splice(index, 1);
          else if (operation.value != null && index >= 0) data.settlements[index] = clone(operation.value);
          else if (operation.value != null) data.settlements.push(clone(operation.value));
        }
      }
      rebuildDerived(data, grid);
      return inverse;
    }

    function apply(transaction) {
      const validation = validate(transaction); if (!validation.ok) return { ok: false, errors: validation.errors };
      const forward = clone(operationsOf(transaction)); const inverse = applyOperations(forward);
      history.push({ forward, inverse }); future.length = 0; revision += 1; emit('apply');
      return { ok: true, revision, state: getState() };
    }
    function undo() {
      const record = history.pop(); if (!record) return { ok: false, reason: 'empty_history' };
      applyOperations(clone(record.inverse)); future.push(record); revision += 1; emit('undo'); return { ok: true, revision };
    }
    function redo() {
      const record = future.pop(); if (!record) return { ok: false, reason: 'empty_future' };
      applyOperations(clone(record.forward)); history.push(record); revision += 1; emit('redo'); return { ok: true, revision };
    }
    function preview(transaction) {
      const validation = validate(transaction); if (!validation.ok) return { ok: false, errors: validation.errors };
      const saved = data; data = clone(data); applyOperations(clone(operationsOf(transaction))); const result = clone(data); data = saved;
      return { ok: true, data: result };
    }
    function importData(nextData) {
      const validation = validateData(nextData); if (!validation.ok) return { ok: false, errors: validation.errors };
      data = rebuildDerived(clone(nextData), grid); history.length = 0; future.length = 0; revision += 1; emit('import'); return { ok: true, revision };
    }
    function getState() { return { revision, cells: grid.cells.length, countries: data.countries.length, settlements: data.settlements.length, canUndo: history.length > 0, canRedo: future.length > 0 }; }
    return { validate, validateData, preview, apply, undo, redo, importData, exportData: () => clone(data), getDataRef: () => data, getState, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
  }

  return { createCellRegistryStore, rebuildDerived };
});
