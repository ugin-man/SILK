const assert = require('assert');
const path = require('path');
const { createCellRegistryStore } = require(path.resolve(__dirname, '../src/cell-registry.js'));

const grid = {
  cells: [
    { center: [-.2, 0, .98] },
    { center: [0, 0, 1] },
    { center: [.2, 0, .98] }
  ],
  faceCenters: [[-.1,.05,.99],[-.1,-.05,.99],[.1,.05,.99],[.1,-.05,.99]],
  dualEdges: [
    { cells: [0, 1], faces: [0, 1] },
    { cells: [1, 2], faces: [2, 3] }
  ]
};
const initial = {
  world_id: 'fixture', terrain: [2, 2, 2], owners: [0, 0, 1], borders: [], settlements: [],
  countries: [
    { id: 'west', name: 'West', point: [-.1,0,.99], cells: 2 },
    { id: 'east', name: 'East', point: [.2,0,.98], cells: 1 }
  ],
  country_label_layout: []
};
const events = [];
const store = createCellRegistryStore(initial, grid, (event) => events.push(event));

assert.strictEqual(store.validate({ type: 'assign_owner', cells: [1], owner: 1 }).ok, true);
store.apply({ type: 'assign_owner', cells: [1], owner: 1 });
assert.deepStrictEqual(store.exportData().owners, [0, 1, 1]);
assert.strictEqual(store.exportData().countries[0].cells, 1);
assert.strictEqual(store.exportData().countries[1].cells, 2);
assert.ok(store.exportData().borders.length >= 1);

store.undo();
assert.deepStrictEqual(store.exportData().owners, [0, 0, 1]);
store.redo();
assert.deepStrictEqual(store.exportData().owners, [0, 1, 1]);

store.apply({ operations: [
  { type: 'set_terrain', cells: [2], terrain: 0 },
  { type: 'assign_owner', cells: [2], owner: -1 }
] });
assert.deepStrictEqual(store.exportData().terrain, [2, 2, 0]);
assert.deepStrictEqual(store.exportData().owners, [0, 1, -1]);
assert.ok(events.length >= 4);
assert.strictEqual(store.getState().revision, 4);
const beforeInvalidImport = store.exportData();
const invalidImport = store.importData({ ...beforeInvalidImport, terrain: [2] });
assert.strictEqual(invalidImport.ok, false);
assert.deepStrictEqual(store.exportData(), beforeInvalidImport, 'invalid imports must not mutate the active registry');
console.log('cell_registry_contract: ok');
