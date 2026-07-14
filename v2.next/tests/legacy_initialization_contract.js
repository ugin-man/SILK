const assert = require('assert');
const fs = require('fs');
const path = require('path');

const candidate = fs.readFileSync(path.resolve(__dirname, '../SILK-V2.html'), 'utf8');
assert.doesNotMatch(candidate, /globeRenderer\s*=\s*createGlobeRenderer\s*\(/, 'legacy globe must not be constructed');
assert.doesNotMatch(candidate, /loomRenderer\s*=\s*createGeographicLoomRenderer\s*\(/, 'legacy LOOM must not be constructed');
assert.match(candidate, /WORLD is owned exclusively by sphere-v2/);
assert.doesNotMatch(candidate, /flatRenderer\s*=\s*createFlatMap\s*\(/, 'legacy Map Editor must not be constructed');
assert.doesNotMatch(candidate, /id="flatCanvas"/, 'legacy flat canvas must be removed');
assert.doesNotMatch(candidate, /class="rail-editor-entry"/, 'legacy Map Editor entry must be removed');
assert.match(candidate, /initializeAtlasRenderer\s*\(\s*\)/, 'ATLAS renderer must remain');
console.log('legacy_initialization_contract: ok');
