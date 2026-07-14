'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const next = path.resolve(__dirname, '..');
const host = fs.readFileSync(path.join(next, 'src', 'plain-host.html'), 'utf8');
const css = fs.readFileSync(path.join(next, 'src', 'integration.css'), 'utf8');
const adapter = fs.readFileSync(path.join(next, 'src', 'host-adapter.js'), 'utf8');
const sphere = fs.readFileSync(path.join(next, 'src', 'world-sphere.js'), 'utf8');
const build = fs.readFileSync(path.join(next, 'scripts', 'build_v2_next.js'), 'utf8');

assert.match(build, /package-guard\.js/);
assert.match(host, /SILK_PACKAGE_GUARD/);
assert.match(host, /validateWorldPackage/);
assert.match(host, /parseWorldPackage/);
assert.match(host, /getPackage/);
assert.match(host, /exportPackage/);
assert.match(host, /downloadPackage/);
assert.match(host, /beforeunload/);
assert.match(host, /silkProjectStatus/);
assert.match(host, /state\.dirty/);
assert.match(host, /map result rejected|MAP rejected|mapResult\.ok === false/);
assert.match(adapter, /silk:cell-registry-change/);
assert.match(sphere, /selectCell/);
assert.match(sphere, /activateSelectedCell/);
assert.match(adapter, /aria-keyshortcuts/);
assert.match(css, /SILK V2 MOBILE/);
assert.match(css, /\.viewport-guard\s*\{\s*display:none!important/);
assert.match(css, /#silkSphereOverlay/);
assert.match(css, /\.silk-project-dock/);

console.log('release_hardening_contract: ok');
