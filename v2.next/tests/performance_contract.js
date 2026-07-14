const assert = require('assert');
const fs = require('fs');
const path = require('path');

const sphere = fs.readFileSync(path.resolve(__dirname, '../src/world-sphere.js'), 'utf8');
const adapter = fs.readFileSync(path.resolve(__dirname, '../src/host-adapter.js'), 'utf8');

assert.match(sphere, /gl\.drawArrays\(gl\.LINES/, 'WHITE cell lines must use a GPU line buffer');
assert.match(sphere, /renderer\.kind === 'canvas2d'/, 'CPU cell outlines must be fallback-only');
assert.match(sphere, /time - lastRender < 32/, 'automatic rotation must be frame-capped');
assert.match(adapter, /if \(mode \|\| visual\) sphere\.setAutoRotate\(false\)/, 'the first UI operation must stop rotation');
assert.match(sphere, /positions = colors = heights = null/, 'uploaded triangle arrays must be released');
assert.match(sphere, /linePositions = null/, 'uploaded line arrays must be released');
console.log('performance_contract: ok');
