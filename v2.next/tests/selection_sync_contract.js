const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { createSelectionBus } = require(path.resolve(__dirname, '../src/host-adapter.js'));
const bus = createSelectionBus();
const events = [];
const unsubscribe = bus.subscribe((event) => events.push(event));

bus.select('starter.polity.alpha', 'world');
bus.select('starter.polity.alpha', 'atlas');
bus.select('starter.city.beta', 'atlas');

assert.deepStrictEqual(events, [
  { id: 'starter.polity.alpha', source: 'world' },
  { id: 'starter.city.beta', source: 'atlas' }
]);
assert.deepStrictEqual(bus.getState(), {
  id: 'starter.city.beta',
  source: 'atlas'
});

unsubscribe();
bus.select('starter.polity.gamma', 'world');
assert.strictEqual(events.length, 2);

const adapter = fs.readFileSync(path.resolve(__dirname, '../src/host-adapter.js'), 'utf8');
assert.match(adapter, /window\.SILK_ATLAS = Object\.freeze/, 'programmatic ATLAS focus must join the selection bus');
assert.match(adapter, /window\.SILK_READER = Object\.freeze/, 'Reader navigation must join the selection bus');
assert.match(adapter, /mode\.dataset\.mode === 'connections'/, 'switching from WORLD to ATLAS must retain focus');
assert.doesNotMatch(adapter, /window\.SILK_MAP\.applyTransaction\?\.\(\{ type: 'select_feature'/, 'WORLD selection must not mutate Spatial Registry or remount the cell sphere');
assert.match(adapter, /baseAtlas\.focusNode\?\.\(id, \{ history: false \}\)/, 'WORLD selection must open the canonical article without replacing map data');
assert.match(adapter, /sphere\.setEditor\(previous\.editor\);\s*if \(Number\.isInteger\(previous\.editor\?\.selectedCell\)\) onCellInspect\(previous\.editor\.selectedCell\)/, 'cell readout must refresh from edited data after a sphere remount');
assert.match(adapter, /SILK_WORLD_SPHERE_FACTORY\.biomeForCell\(data, index\)/, 'cell readout must use the same edited-terrain precedence as the renderer');
assert.doesNotMatch(adapter, /remountSphere\(cellStore\.getDataRef\(\), 'cell_transaction'/, 'cell edits must not recreate the WebGL sphere');
assert.match(adapter, /sphere\.refresh\(nextData\)/, 'cell edits must refresh the existing sphere in place');
console.log('selection_sync_contract: ok');
