const assert = require('assert');
const path = require('path');
const { unpackGrid } = require(path.resolve(__dirname, '../src/world-sphere.js'));

const packed = {
  format: 'silk-sphere-grid-packed-v1', frequency: 1, cell_count: 2,
  centers: [-.1,0,.99,.1,0,.99], face_offsets: [0,3,6], faces: [0,1,2,1,3,2],
  face_centers: [-.2,-.1,.97,0,.14,.99,0,-.14,.99,.2,-.1,.97],
  dual_cells: [0,1], dual_faces: [1,2]
};
const grid = unpackGrid(packed);
assert.strictEqual(grid.cells.length, 2);
assert.deepStrictEqual(grid.cells[0], { center: [-.1,0,.99], faces: [0,1,2] });
assert.deepStrictEqual(grid.faceCenters[3], [.2,-.1,.97]);
assert.deepStrictEqual(grid.dualEdges[0], { cells: [0,1], faces: [1,2] });
assert.strictEqual(unpackGrid(grid), grid, 'already expanded grids must not be rebuilt');
console.log('grid_pack_contract: ok');
