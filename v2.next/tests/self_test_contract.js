const assert = require('assert');
const path = require('path');
const { evaluateSnapshot } = require(path.resolve(__dirname, '../src/self-test.js'));

const valid = evaluateSnapshot({
  productModes: ['world', 'connections'], worldStyles: ['SURFACE', 'WHITE'], requiredDom: true,
  requiredApis: true, mapTransactions: true, atlasReader: true, legacyWorldHidden: true,
  sphere: { renderer: 'webgl2', cells: 12962, meshBuilds: 1, available: true }, runtimeErrors: []
});
assert.strictEqual(valid.ok, true);
assert.deepStrictEqual(valid.failures, []);

const invalid = evaluateSnapshot({
  productModes: ['world', 'flat', 'connections'], worldStyles: ['SURFACE', 'WHITE'], requiredDom: false,
  requiredApis: false, mapTransactions: false, atlasReader: false, legacyWorldHidden: false,
  sphere: { renderer: null, cells: 0, meshBuilds: 2, available: true }, runtimeErrors: ['boom']
});
assert.strictEqual(invalid.ok, false);
assert.ok(invalid.failures.length >= 7);
console.log('self_test_contract: ok');
