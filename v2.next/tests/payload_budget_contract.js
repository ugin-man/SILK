const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { unpackGrid } = require(path.resolve(__dirname, '../src/world-sphere.js'));

const candidatePath = path.resolve(__dirname, '../SILK-V2.html');
const html = fs.readFileSync(candidatePath, 'utf8');
assert.ok(Buffer.byteLength(html) < 5_000_000, 'standalone candidate must stay below 5 MB');
const match = html.match(/<script[^>]+id="silk-sphere-grid"[^>]*>([\s\S]*?)<\/script>/i);
assert.ok(match, 'packed sphere grid must be embedded');
const payload = JSON.parse(match[1]);
assert.strictEqual(payload.format, 'silk-sphere-grid-packed-v1');
const started = performance.now();
const grid = unpackGrid(payload);
const elapsed = performance.now() - started;
assert.strictEqual(grid.cells.length, 12962);
assert.ok(elapsed < 1000, `grid unpack exceeded 1 second: ${elapsed.toFixed(1)} ms`);
console.log(`payload_budget_contract: ok (${Buffer.byteLength(html)} bytes, unpack ${elapsed.toFixed(1)} ms)`);
