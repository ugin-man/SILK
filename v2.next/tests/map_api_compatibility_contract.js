const assert = require('assert');
const fs = require('fs');
const path = require('path');

const fixture = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'fixtures/required_contract.json'), 'utf8')
);
const candidatePath = path.resolve(__dirname, '../SILK-V2.html');
assert.ok(fs.existsSync(candidatePath), `candidate missing: ${candidatePath}`);

const html = fs.readFileSync(candidatePath, 'utf8');
for (const api of fixture.required_apis) {
  assert.match(html, new RegExp(`window\\.${api}\\s*=`), `${api} must remain public`);
}

for (const method of fixture.required_map_methods) {
  assert.match(html, new RegExp(`\\b${method}\\s*[:(]`), `SILK_MAP.${method} must remain available`);
}

assert.match(html, /WORLD is owned exclusively by sphere-v2/, 'cell WORLD must exclusively own the WORLD surface');
assert.doesNotMatch(html, /flatRenderer\s*=\s*createFlatMap\s*\(/, 'legacy Map Editor must not be initialized');
console.log('map_api_compatibility_contract: ok');
