const assert = require('assert');
const path = require('path');

const sourcePath = path.resolve(__dirname, '../src/world-sphere.js');
const { createLifecycle, terrainColor, reliefPoint, cameraForData, biomeForCell, normalizeLayers } = require(sourcePath);

assert.deepStrictEqual(normalizeLayers(), { borders: true, countryLabels: true, cities: true });
assert.deepStrictEqual(normalizeLayers({ borders: false, cities: 0 }), { borders: false, countryLabels: true, cities: false });

const lifecycle = createLifecycle();
assert.strictEqual(lifecycle.getState().meshBuilds, 0);

lifecycle.markMeshBuilt();
assert.strictEqual(lifecycle.getState().meshBuilds, 1);

lifecycle.setStyle('white');
lifecycle.setStyle('surface');
assert.strictEqual(
  lifecycle.getState().meshBuilds,
  1,
  'SURFACE/WHITE switching must not rebuild the sphere mesh'
);

assert.strictEqual(terrainColor(2, 0, [], { 2: 'grassland' }), terrainColor(2, 1, [], { 2: 'grassland' }), 'political ownership must not erase terrain color');
assert.notStrictEqual(terrainColor(2, -1, [], { 2: 'grassland' }), terrainColor(4, -1, [], { 4: 'desert' }), 'terrain categories need distinct colors');
assert.deepStrictEqual(reliefPoint([0, 0, 1], 4, .025, 'white'), [0, 0, 1]);
assert.deepStrictEqual(reliefPoint([0, 0, 1], 4, .025, 'surface'), [0, 0, 1.1]);
const camera = cameraForData({ owners: [0, -1] }, { cells: [{ center: [.7, .2, .68] }, { center: [-.7, 0, .68] }] });
assert.ok(camera.yaw < 0, 'positive-longitude geography must rotate toward screen center');
assert.ok(camera.pitch > 0, 'northern geography must rotate toward screen center');
assert.strictEqual(biomeForCell({ terrain: [2], relief: { biomes: [3] } }, 0), 3, 'compiled biome must drive an untouched cell');
assert.strictEqual(biomeForCell({ terrain: ['desert'], relief: { biomes: [3] } }, 0), 'desert', 'an edited semantic terrain value must override the compiled biome');

const sphereSource = require('fs').readFileSync(sourcePath, 'utf8');
assert.match(sphereSource, /setCamera\(next\)/, 'sphere renderer must expose camera restoration for edit remounts');
assert.match(sphereSource, /WEBGL_lose_context/, 'destroyed sphere renderers must explicitly release their GPU context');
assert.match(sphereSource, /renderer\.destroy\?\.\(\)/, 'sphere teardown must dispose renderer resources before removing the canvas');
assert.match(sphereSource, /updateData\(nextData\)/, 'renderer must update edited cell data without creating a new WebGL context');
assert.match(sphereSource, /setLayers\(next\)/, 'sphere renderer must expose non-destructive display layers');

lifecycle.setVisible(true);
assert.strictEqual(lifecycle.shouldRender(), true);
lifecycle.noteInteraction();
assert.strictEqual(lifecycle.getState().autoRotate, false);

lifecycle.setVisible(false);
assert.strictEqual(
  lifecycle.shouldRender(),
  false,
  'WORLD rendering must stop while ATLAS or MAP EDITOR is visible'
);

console.log('world_sphere_contract: ok');
