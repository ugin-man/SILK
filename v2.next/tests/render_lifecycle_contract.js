const assert = require('assert');
const path = require('path');

const { createLifecycle } = require(path.resolve(__dirname, '../src/world-sphere.js'));
const lifecycle = createLifecycle();

lifecycle.setVisible(true);
lifecycle.setAutoRotate(true);
assert.strictEqual(lifecycle.shouldScheduleNextFrame(), true);

lifecycle.noteInteraction();
assert.strictEqual(lifecycle.shouldScheduleNextFrame(), false);

lifecycle.requestRender();
assert.strictEqual(lifecycle.shouldRender(), true);
lifecycle.noteRendered();
assert.strictEqual(lifecycle.shouldRender(), false);

lifecycle.setStyle('surface');
assert.strictEqual(lifecycle.shouldRender(), false, 'reselecting the active style must be a no-op');
lifecycle.setStyle('white');
assert.strictEqual(lifecycle.shouldRender(), true);
lifecycle.noteRendered();

lifecycle.setVisible(false);
lifecycle.setAutoRotate(true);
assert.strictEqual(lifecycle.shouldScheduleNextFrame(), false);
assert.strictEqual(lifecycle.shouldRender(), false);
console.log('render_lifecycle_contract: ok');
