const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const sphere = fs.readFileSync(path.join(root, 'src', 'world-sphere.js'), 'utf8');
const adapter = fs.readFileSync(path.join(root, 'src', 'host-adapter.js'), 'utf8');
const build = fs.readFileSync(path.join(root, 'scripts', 'build_v2_next.js'), 'utf8');

assert.match(sphere, /let cameraTween = null/,
  'WORLD must own an interruptible camera tween');
assert.match(sphere, /function easeOutCubic\(/,
  'WORLD reset must use an explicit ease-out curve');
assert.match(sphere, /function shortestYawDelta\(/,
  'WORLD reset must rotate through the shortest yaw path');
assert.match(sphere, /reset\(options = \{\}\)[\s\S]*duration[\s\S]*650/,
  'WORLD reset must support the approved 650ms animated reset');
assert.match(sphere, /prefers-reduced-motion: reduce/,
  'WORLD reset must respect reduced-motion');
assert.match(sphere, /pointerdown[\s\S]*cancelCameraTween\(\)/,
  'WORLD pointer interaction must cancel camera animation');

assert.match(adapter, /data-action=["']overview["'][\s\S]*sphere\.reset\(\{ animate: true, duration: 650 \}\)/,
  'WORLD logo must invoke the animated sphere reset');
assert.match(adapter, /stopImmediatePropagation\(\)/,
  'WORLD logo must suppress the stale legacy overview handler');

assert.match(build, /suppressNextClick/,
  'ATLAS must remember that a drag-generated click should be suppressed');
assert.match(build, /this\.drag\.moved[\s\S]*suppressNextClick/,
  'ATLAS pointerup must set suppression from the drag threshold');
assert.match(build, /if \(this\.suppressNextClick\)[\s\S]*return/,
  'ATLAS click handler must consume the suppression once');

console.log('camera_navigation_contract: ok');
