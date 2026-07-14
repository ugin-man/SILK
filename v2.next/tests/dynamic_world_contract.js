const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { deriveSphereData, isGeographicPackage } = require(path.resolve(__dirname, '../src/host-adapter.js'));

const grid = {
  frequency: 1,
  cells: [
    { center: [-0.1, 0, 0.995], faces: [0, 1, 2] },
    { center: [0.1, 0, 0.995], faces: [1, 2, 3] }
  ],
  faceCenters: [[-0.12, -0.04, 0.99], [0, 0.06, 0.99], [0, -0.06, 0.99], [0.12, .04, .99]],
  dualEdges: [{ cells: [0, 1], faces: [1, 2] }]
};
const pkg = {
  world_id: 'fixture_world',
  rendererProfile: { primary: 'globe', fallback: 'flat_map' },
  spaceModel: { type: 'continental' },
  subjects: [
    { id: 'polity.west', name: 'West' },
    { id: 'polity.east', name: 'East' },
    { id: 'city.capital', name: 'Capital' }
  ],
  spatial_registry: {
    terrain_blueprint: { patch: { center: [0, 0], span: [40, 40] } },
    features: [
      { id: 'f.west', subject_id: 'polity.west', geometry: { type: 'Polygon', coordinates: [[[0,0],[.5,0],[.5,1],[0,1],[0,0]]] } },
      { id: 'f.east', subject_id: 'polity.east', geometry: { type: 'Polygon', coordinates: [[[.5,0],[1,0],[1,1],[.5,1],[.5,0]]] } },
      { id: 'f.capital', subject_id: 'city.capital', geometry: { type: 'Point', coordinates: [.25,.5] }, properties: { importance: 100, role: 'capital' } }
    ]
  }
};

assert.strictEqual(isGeographicPackage(pkg), true);
const result = deriveSphereData(pkg, pkg.spatial_registry, grid);
assert.strictEqual(result.available, true);
assert.strictEqual(result.source, 'spatial_registry');
assert.strictEqual(result.data.terrain.length, grid.cells.length);
assert.strictEqual(result.data.owners.length, grid.cells.length);
assert.strictEqual(result.data.countries.length, 2);
assert.strictEqual(result.data.settlements.length, 1);
assert.ok(result.data.borders.length >= 1);

const invalidExplicit = { ...pkg, spherical_cells: { terrain: [2, 2], owners: [9, 9], countries: [] } };
const recovered = deriveSphereData(invalidExplicit, pkg.spatial_registry, grid);
assert.strictEqual(recovered.available, true);
assert.strictEqual(recovered.source, 'spatial_registry', 'invalid cell data must fall back to Spatial Registry');

const dungeon = { world_id: 'dungeon', rendererProfile: { primary: 'atlas' }, spaceModel: { type: 'layered_dungeon' } };
assert.strictEqual(isGeographicPackage(dungeon), false);
assert.strictEqual(deriveSphereData(dungeon, { features: [] }, grid).available, false);

const candidate = fs.readFileSync(path.resolve(__dirname, '../SILK-V2.html'), 'utf8');
assert.match(candidate, /silk:project-loaded/);
assert.match(candidate, /deriveSphereData/);
assert.match(candidate, /classList\.contains\('is-active'\)/, 'WORLD style sync must follow the host UI class');
console.log('dynamic_world_contract: ok');
