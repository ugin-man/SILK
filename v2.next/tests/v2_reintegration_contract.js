'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const nextRoot = path.resolve(__dirname, '..');
const candidatePath = path.join(nextRoot, 'SILK-V2.html');
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'required_contract.json'), 'utf8'));

assert(fs.existsSync(candidatePath), 'candidate missing: v2.next/SILK-V2.html');
const html = fs.readFileSync(candidatePath, 'utf8');
const modeSwitch = html.match(/<nav class="mode-switch"[\s\S]*?<\/nav>/)?.[0] || '';
const worldStyleSwitch = html.match(/<div class="world-style-switch"[\s\S]*?<\/div>/)?.[0] || '';

const modeValues = [...modeSwitch.matchAll(/data-mode="([^"]+)"/g)].map(match => match[1]);
assert.deepStrictEqual(modeValues, fixture.product_modes, 'product modes must remain WORLD and ATLAS only');
for (const label of fixture.product_mode_labels) assert(modeSwitch.includes(label), `missing product mode label: ${label}`);
for (const label of fixture.forbidden_product_labels) assert(!modeSwitch.includes(label), `forbidden product mode label: ${label}`);
for (const label of fixture.world_styles) assert(worldStyleSwitch.includes(label), `missing WORLD style: ${label}`);
assert(!worldStyleSwitch.includes('>LOOM<') && !worldStyleSwitch.includes('V1風'), 'LOOM must not be exposed as a WORLD style label');

for (const id of fixture.required_ids) assert(new RegExp(`id=["']${id}["']`).test(html), `required existing surface missing: ${id}`);
for (const api of fixture.required_apis) assert(html.includes(`window.${api}`), `required API missing: ${api}`);
for (const method of fixture.required_map_methods) assert(html.includes(`${method}:`), `SILK_MAP method missing: ${method}`);
assert(html.includes(fixture.candidate_marker), 'sphere integration marker missing');
assert(html.includes('window.SILK_WORLD_SPHERE'), 'sphere renderer API missing');
assert(html.includes('data-world-visual="terrain">SURFACE'), 'SURFACE switch is not wired to terrain view');
assert(html.includes('data-world-visual="loom">WHITE'), 'WHITE switch is not wired to white view');
assert(!html.includes('id="flatCanvas"'), 'legacy flat map canvas must not survive the WORLD replacement');
assert(!html.includes('class="rail-editor-entry"'), 'legacy WORLD rail must not survive the WORLD replacement');
assert(html.includes('id="sphereWorldRail"') && html.includes('id="sphereWorldMount"'), 'cell-native WORLD shell is missing');
assert(html.includes('data-sphere-rail-tab="display"') && html.includes('data-sphere-rail-tab="edit"'), 'WORLD rail must switch between display and edit in place');
for (const layer of ['borders', 'countryLabels', 'cities']) assert(html.includes(`data-sphere-layer="${layer}"`), `WORLD display layer missing: ${layer}`);
assert(html.includes('data-sphere-preset="terrain"'), 'WORLD needs a terrain-only display preset');
assert(/\.sphere-world-rail \.world-style-switch[^}]*position:static/.test(html), 'WORLD style switch must stay inside the left rail');
assert.strictEqual((html.match(/ATLAS single-click selection is owned by V2\.NEXT/g) || []).length, 2, 'both ATLAS renderer paths must support single-click selection');
assert(/\.atlas-reader-index-header strong[^}]*white-space:normal/.test(html), 'READER world title must wrap instead of crossing its column');
assert(html.includes('id="atlasSharedRail"') && html.includes('id="atlasRailGraphPanel"') && html.includes('id="atlasRailReaderPanel"'), 'ATLAS shared rail shell is missing');
assert(html.includes('data-atlas-rail-surface="graph"') && html.includes('data-atlas-rail-surface="reader"'), 'ATLAS shared rail tabs are missing');
assert(html.includes('installAtlasSharedRail'), 'ATLAS shared rail runtime integration is missing');
assert(/\.atlas-reader[^}]*var\(--rail\)/.test(html), 'READER must begin to the right of the shared rail');
assert(/\.atlas-surface-switch[^}]*display:none!important/.test(html), 'legacy floating ATLAS switch must be visually removed');
assert(/data-atlas-surface="reader"\] \.left-rail[^}]*display:block!important/.test(html), 'READER must keep the shared left rail visible');
assert(html.includes('世界パッケージに含まれる地理データを球面セルで表示します'), 'WORLD must explain its public cell-registry function');
assert(!html.includes("document.querySelectorAll('[data-world-visual]').forEach(button => button.addEventListener('click', () => setWorldVisual(button.dataset.worldVisual)))"), 'legacy WORLD visual click handler must not survive sphere integration');
assert(html.includes("state.mode === 'connections' || document.getElementById('sphereWorldMount')"), 'WORLD sphere selections must use the canonical semantic inspector');

console.log(JSON.stringify({ ok:true, modes:modeValues, worldStyles:fixture.world_styles, requiredApis:fixture.required_apis }, null, 2));
