'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const next = path.resolve(__dirname, '..');
const root = path.resolve(next, '..');
const releasePath = path.join(next, 'SILK-V2.html');
const compatibilityPath = path.join(next, 'SILK-V2-NEXT.html');
const html = fs.readFileSync(releasePath, 'utf8');
const compatibility = fs.readFileSync(compatibilityPath, 'utf8');
const buildSource = fs.readFileSync(path.join(next, 'scripts', 'build_v2_next.js'), 'utf8');
const active = JSON.parse(fs.readFileSync(path.join(root, 'ACTIVE_VERSION.json'), 'utf8'));

function embeddedJson(id) {
  const match = html.match(new RegExp(`<script[^>]+id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`, 'i'));
  assert(match, `embedded JSON missing: ${id}`);
  return JSON.parse(match[1]);
}

const pkg = embeddedJson('silk-world-package');
const cells = embeddedJson('silk-sphere-cells');
const grid = embeddedJson('silk-sphere-grid');

assert.strictEqual(pkg.world_id, 'starter_world');
assert.strictEqual(pkg.subjects.length, 1);
assert.strictEqual(pkg.subjects[0].id, 'world.starter');
assert.strictEqual(pkg.relations.length, 0);
assert.strictEqual(pkg.features.length, 0);
assert.strictEqual(cells.world_id, 'starter_world');
assert.strictEqual(cells.terrain.length, 12962);
assert.strictEqual(grid.cell_count, 12962);
assert(cells.terrain.every(value => value === 'ocean'), 'all initial cells must be ocean');
assert(cells.owners.every(value => value === -1), 'all initial cells must be unowned');
assert.strictEqual(cells.countries.length, 0);
assert.strictEqual(cells.settlements.length, 0);
assert.strictEqual(cells.borders.length, 0);

assert.strictEqual(
  crypto.createHash('sha256').update(html).digest('hex'),
  crypto.createHash('sha256').update(compatibility).digest('hex'),
  'release and compatibility HTML must be identical'
);

assert.doesNotMatch(html, /arnebia|アルネビア|lunaris|ルナリス|blackwater|sablemouth|saltwind|greybell|グレイベル|湾岸戦争/i);
assert.doesNotMatch(html, /正本の地理制約|旧MAP EDITOR|BUILD SOURCE|GEOGRAPHIC INTENT|HIDDEN SURFACE|WOVEN WORLD-BODY|点を作り、縦に掘り/i);
assert.match(html, /WORLD RELATION SPHERE/);
assert.match(html, /世界設定の主題と関係を球面グラフで表示します/);
assert.match(html, /\.mode-button\[data-mode="world"\], \.mode-button\[data-mode="connections"\]/);

assert.doesNotMatch(buildSource, /recovery|novel_world|arnebia/i, 'release build must not depend on demo or recovery inputs');
assert.match(buildSource, /path\.join\(next, 'data', 'plain-world\.json'\)/);
assert.strictEqual(active.active, 'v2.next/SILK-V2.html');
assert.strictEqual(active.stage, 'v2-release-candidate');

console.log('plain release contract: ok');
