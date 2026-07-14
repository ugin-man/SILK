'use strict';

const fs = require('fs');
const path = require('path');
const { buildGeodesic } = require('../../scripts/lib/geodesic_grid.js');

const root = path.resolve(__dirname, '../..');
const next = path.resolve(__dirname, '..');
const hostPath = path.join(next, 'src', 'plain-host.html');
const packagePath = path.join(next, 'data', 'plain-world.json');
const outputPath = path.join(next, 'SILK-V2.html');
const compatibilityOutputPath = path.join(next, 'SILK-V2-NEXT.html');
const readText = (file) => fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n');

const host = readText(hostPath);
const worldPackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
if (worldPackage.world_id !== 'starter_world') throw new Error('Plain package world_id must be starter_world');
if (worldPackage.subjects?.length !== 1 || worldPackage.relations?.length !== 0) throw new Error('Plain package must contain one guide subject and no relations');

const built = buildGeodesic(36);
const cellCount = built.cells.length;
const cells = {
  format: 'silk-spherical-cells-v3',
  version: '2.0.0',
  world_id: 'starter_world',
  frequency: built.frequency,
  cell_count: cellCount,
  terrain: Array(cellCount).fill('ocean'),
  terrain_legend: { ocean: 'ocean' },
  biome_legend: { 0: 'ocean' },
  owners: Array(cellCount).fill(-1),
  countries: [],
  borders: [],
  settlements: [],
  country_label_layout: [],
  landforms: Array(cellCount).fill(-1),
  landform_ids: [],
  relief: {
    elevation: Array(cellCount).fill(0),
    biomes: Array(cellCount).fill(0),
    scales: Array(cellCount).fill(1),
    height_scale: 0.025,
    mode_policy: { terrain: true, loom: false }
  }
};
const round = (value) => Number(Number(value).toFixed(7));
const faceOffsets = [0], faces = [];
for (const cell of built.cells) { faces.push(...cell.faces); faceOffsets.push(faces.length); }
const grid = {
  format: 'silk-sphere-grid-packed-v1', frequency: built.frequency, cell_count: built.cells.length,
  centers: built.cells.flatMap((cell) => cell.center.map(round)), face_offsets: faceOffsets, faces,
  face_centers: built.faceCenters.flatMap((point) => point.map(round)),
  dual_cells: built.dualEdges.flatMap((edge) => edge.cells), dual_faces: built.dualEdges.flatMap((edge) => edge.faces)
};

const css = readText(path.join(next, 'src', 'integration.css'));
const guard = readText(path.join(next, 'src', 'package-guard.js'));
const registry = readText(path.join(next, 'src', 'cell-registry.js'));
const sphere = readText(path.join(next, 'src', 'world-sphere.js'));
const adapter = readText(path.join(next, 'src', 'host-adapter.js'));
const selfTest = readText(path.join(next, 'src', 'self-test.js'));

const worldRail = `<section class="sphere-world-rail" id="sphereWorldRail">
  <header class="sphere-rail-hero"><span>WORLD / CELL REGISTRY</span><strong>GEODESIC WORLD</strong><p>世界パッケージに含まれる地理データを球面セルで表示します。表示項目の切替とセル単位の編集ができます。</p></header>
  <nav class="sphere-rail-tabs" role="tablist" aria-label="WORLD操作"><button type="button" class="is-active" role="tab" aria-selected="true" data-sphere-rail-tab="display">表示</button><button type="button" role="tab" aria-selected="false" data-sphere-rail-tab="edit">編集</button></nav>
  <div class="sphere-rail-panel" data-sphere-rail-panel="display">
    <section class="sphere-rail-section"><span class="sphere-rail-kicker">WORLD STYLE</span><div class="world-style-switch" id="worldStyleSwitch" aria-label="WORLD表示スタイル"><button class="is-active" data-world-visual="terrain">SURFACE<small>地形表示</small></button><button data-world-visual="loom">WHITE<small>セル表示</small></button></div></section>
    <section class="sphere-rail-section"><span class="sphere-rail-kicker">VIEW PRESET</span><div class="sphere-display-presets"><button type="button" data-sphere-preset="all">すべて表示</button><button type="button" data-sphere-preset="terrain">地形のみ</button><button type="button" data-sphere-preset="political">政治地図</button><button type="button" data-sphere-preset="cities">都市を見る</button></div></section>
    <section class="sphere-rail-section"><span class="sphere-rail-kicker">DISPLAY LAYERS</span><div class="sphere-layer-list"><button type="button" aria-pressed="true" data-sphere-layer="borders">国境線</button><button type="button" aria-pressed="true" data-sphere-layer="countryLabels">国家名</button><button type="button" aria-pressed="true" data-sphere-layer="cities">都市</button></div></section>
  </div>
  <div class="sphere-rail-panel" data-sphere-rail-panel="edit" hidden>
    <section class="sphere-rail-section"><span class="sphere-rail-kicker">CELL TOOL</span><div class="sphere-tool-row"><button type="button" class="is-active" data-sphere-tool="inspect">閲覧</button><button type="button" data-sphere-tool="terrain">地形編集</button><button type="button" data-sphere-tool="owner">領域編集</button><button type="button" data-sphere-tool="erase">所属解除</button></div><output id="sphereToolStatus">セルを選択すると設定を確認できます。</output></section>
    <section class="sphere-rail-section sphere-editor-fields"><label id="sphereTerrainField">地形<select id="sphereTerrainSelect"><option value="grassland">草原</option><option value="highland">高原</option><option value="forest">森林</option><option value="desert">砂漠</option><option value="mountain">山地</option><option value="snow">雪山</option><option value="ocean">海</option></select></label><label id="sphereOwnerField">国家<select id="sphereOwnerSelect"></select></label><label>ブラシ<select id="sphereBrushSelect"><option value="0">1セル</option><option value="1">周囲1</option><option value="2">周囲2</option></select></label></section>
    <section class="sphere-rail-section"><div class="sphere-history-row"><button type="button" id="sphereUndo">UNDO</button><button type="button" id="sphereRedo">REDO</button></div><output id="sphereCellReadout">セルを選択してください</output></section>
  </div>
  <section class="sphere-rail-section sphere-build-proof"><span>WORLD STATUS</span><strong>EMPTY REGISTRY</strong><small>世界パッケージを読み込むと、国家・都市・地形が表示されます。</small></section>
</section>`;

const worldView = `<section class="stage-view is-active sphere-world-view" id="worldView">
  <div class="sphere-world-mount" id="sphereWorldMount"></div>
  <header class="sphere-world-chrome"><div><span>GEOGRAPHIC WORLD / CELL ATLAS</span><h1>新しい世界</h1><p>ドラッグで回転、ホイールでズーム。世界パッケージを読み込むと、都市・国家・地形を確認できます。</p></div></header>
  <div class="sphere-world-hint">EMPTY CELL REGISTRY / IMPORT A WORLD PACKAGE</div>
</section><div id="flatView" hidden aria-hidden="true"></div>`;

const atlasSharedRail = `<section class="atlas-shared-rail" id="atlasSharedRail" hidden>
  <nav class="atlas-rail-tabs" role="tablist" aria-label="ATLAS表示方法"><button type="button" class="is-active" role="tab" aria-selected="true" data-atlas-rail-surface="graph">グラフ</button><button type="button" role="tab" aria-selected="false" data-atlas-rail-surface="reader">リーダー</button></nav>
  <div class="atlas-rail-panel" id="atlasRailGraphPanel" data-atlas-rail-panel="graph"></div>
  <div class="atlas-rail-panel" id="atlasRailReaderPanel" data-atlas-rail-panel="reader" hidden></div>
</section>`;

if (!host.includes('/*__SILK_WORLD_PACKAGE__*/')) throw new Error('Plain host package marker not found');
let candidate = host
  .replace('/*__SILK_WORLD_PACKAGE__*/', JSON.stringify(worldPackage).replace(/<\//g, '<\\/'))
  .replace(/V2\.10\.[23]/g, 'V2');
const leftRailPattern = /(<aside class="left-rail"[^>]*>)[\s\S]*?(<div class="connections-rail" id="connectionsRail")/;
if (!leftRailPattern.test(candidate)) throw new Error('Legacy WORLD rail seam not found');
candidate = candidate.replace(leftRailPattern, `$1${worldRail}${atlasSharedRail}$2`);

const worldPattern = /<section[^>]*id="worldView"[^>]*>[\s\S]*?<\/section>\s*<section[^>]*id="flatView"[^>]*>[\s\S]*?<\/section>/;
if (!worldPattern.test(candidate)) throw new Error('Legacy WORLD/Map Editor DOM seam not found');
candidate = candidate.replace(worldPattern, worldView);
candidate = candidate
  .replace("document.getElementById('snapshotSelect').addEventListener", "document.getElementById('snapshotSelect')?.addEventListener")
  .replace("document.querySelector('[data-action=\"reset-layers\"]').addEventListener", "document.querySelector('[data-action=\"reset-layers\"]')?.addEventListener");

const legacyVisualBinding = "document.querySelectorAll('[data-world-visual]').forEach(button => button.addEventListener('click', () => setWorldVisual(button.dataset.worldVisual)));";
if (!candidate.includes(legacyVisualBinding)) throw new Error('Legacy WORLD visual binding seam not found');
candidate = candidate.replace(legacyVisualBinding, '// WORLD visual switching is owned exclusively by sphere-v2');
candidate = candidate.replace('function renderWorldVisualSwitch() {', "function renderWorldVisualSwitch() { if (document.getElementById('sphereWorldMount')) return;");
candidate = candidate.replace('function setWorldVisual(mode) {', "function setWorldVisual(mode) { if (document.getElementById('sphereWorldMount')) return;");

const legacyTerrainInitialization = '  renderTerrainToCanvas(model, textureCanvas, TERRAIN_TEXTURE);';
if (!candidate.includes(legacyTerrainInitialization)) throw new Error('Legacy terrain initialization seam not found');
candidate = candidate.replace(legacyTerrainInitialization, '  // Legacy terrain initialization is disabled; sphere-v2 owns WORLD.');

const inspectorNeedle = "function renderInspector() {\n  if (state.mode === 'connections') return renderSemanticInspector();";
if (!candidate.includes(inspectorNeedle)) throw new Error('Inspector routing seam not found');
candidate = candidate.replace(inspectorNeedle, "function renderInspector() {\n  if (state.mode === 'connections' || document.getElementById('sphereWorldMount')) return renderSemanticInspector();");

for (const [name, requiredId] of [
  ['renderLayers', 'layerList'],
  ['renderSnapshots', 'snapshotSelect'],
  ['renderAnchors', 'anchorList'],
  ['renderValidation', 'validationSummary']
]) {
  const seam = `function ${name}() {`;
  if (!candidate.includes(seam)) throw new Error(`Legacy WORLD render seam not found: ${name}`);
  candidate = candidate.replace(seam, `${seam} if (!document.getElementById('${requiredId}')) return;`);
}

const legacyWorldStart = candidate.indexOf('  try {\n    globeRenderer = createGlobeRenderer({');
const atlasInit = candidate.indexOf('  initializeAtlasRenderer();', legacyWorldStart);
if (legacyWorldStart < 0 || atlasInit < 0) throw new Error('Legacy WORLD initialization seam not found');
const atlasInitEnd = atlasInit + '  initializeAtlasRenderer();'.length;
candidate = `${candidate.slice(0, legacyWorldStart)}  // WORLD is owned exclusively by sphere-v2\n  globeRenderer = null;\n  loomRenderer = null;\n  flatRenderer = null;\n  initializeAtlasRenderer();${candidate.slice(atlasInitEnd)}`;
candidate = candidate.replace(/primary === 'flat_map' \? 'flat' : 'world'/g, "'world'");
candidate = candidate.replace(/\['world', 'flat', 'connections'\]/g, "['world', 'connections']");

const atlasPrimaryDoubleClickNeedle = `      this.canvas.addEventListener('dblclick', event => {
        const point = this.localPoint(event);
        const hit = this.hitTest(point);
        if (hit?.type === 'node') {
          this.callbacks.onSelectSubject(hit.id);
          this.focusSubject(hit.id, true);
        } else if (hit?.type === 'collection') {
          this.callbacks.onOpenCollection(hit.id);
          this.focusCollection(hit.id);
        } else {
          this.zoomBy(1.32, point);
        }
      });`;
if (!candidate.includes(atlasPrimaryDoubleClickNeedle)) throw new Error('Primary ATLAS double-click seam not found');
candidate = candidate.replace(atlasPrimaryDoubleClickNeedle, `      // ATLAS single-click selection is owned by V2.NEXT
      this.canvas.addEventListener('click', event => {
        if (event.detail !== 1) return;
        if (this.suppressNextClick) { this.suppressNextClick = false; return; }
        const point = this.localPoint(event);
        const hit = this.hitTest(point);
        if (hit?.type === 'node') this.callbacks.onSelectSubject(hit.id);
        else if (hit?.type === 'collection') {
          this.callbacks.onOpenCollection(hit.id);
          this.focusCollection(hit.id);
        }
      });
      this.canvas.addEventListener('dblclick', event => {
        const point = this.localPoint(event);
        const hit = this.hitTest(point);
        if (hit?.type === 'node') this.focusSubject(hit.id, true);
        else if (hit?.type === 'collection') this.focusCollection(hit.id);
        else this.zoomBy(1.32, point);
      });`);

const atlasDoubleClickNeedle = `      this.canvas.addEventListener('dblclick', event => {
        const point = this.localPoint(event);
        const hit = this.hitTest(point);
        if (hit?.type === 'node') {
          this.setSelection(hit.id);
          this.callbacks.onSelectSubject(hit.id);
          this.focusSubject(hit.id, true, { history: false });
        } else if (hit?.type === 'collection') {
          this.callbacks.onOpenCollection(hit.id);
          this.focusCollection(hit.id);
        } else this.zoomBy(1.34, point);
      });`;
if (!candidate.includes(atlasDoubleClickNeedle)) throw new Error('Current ATLAS double-click seam not found');
candidate = candidate.replace(atlasDoubleClickNeedle, `      // ATLAS single-click selection is owned by V2.NEXT
      this.canvas.addEventListener('click', event => {
        if (event.detail !== 1) return;
        if (this.suppressNextClick) { this.suppressNextClick = false; return; }
        const point = this.localPoint(event);
        const hit = this.hitTest(point);
        if (hit?.type === 'node') {
          this.setSelection(hit.id);
          this.callbacks.onSelectSubject(hit.id);
        } else if (hit?.type === 'collection') {
          this.callbacks.onOpenCollection(hit.id);
          this.focusCollection(hit.id);
        }
      });
      this.canvas.addEventListener('dblclick', event => {
        const point = this.localPoint(event);
        const hit = this.hitTest(point);
        if (hit?.type === 'node') this.focusSubject(hit.id, true, { history: false });
        else if (hit?.type === 'collection') this.focusCollection(hit.id);
        else this.zoomBy(1.34, point);
      });`);

const atlasDragReleaseNeedle = `      if (this.drag.moved) {
        this.history.push(this.drag.snapshot);`;
if (!candidate.includes(atlasDragReleaseNeedle)) throw new Error('Current ATLAS drag-release seam not found');
candidate = candidate.replace(atlasDragReleaseNeedle, `      if (this.drag.moved) {
        this.suppressNextClick = true;
        this.history.push(this.drag.snapshot);`);

const primaryAtlasDragReleaseNeedle = `      if (this.dragMoved) {
        this.callbacks.onCameraChange(this.getCamera(), this.zoomBand);`;
if (!candidate.includes(primaryAtlasDragReleaseNeedle)) throw new Error('Primary ATLAS drag-release seam not found');
candidate = candidate.replace(primaryAtlasDragReleaseNeedle, `      if (this.dragMoved) {
        this.suppressNextClick = true;
        this.callbacks.onCameraChange(this.getCamera(), this.zoomBand);`);
const injection = `
<style id="silk-world-sphere-v2-style">${css}</style>
<script id="silk-package-guard-source">${guard.replace(/<\//g, '<\\/')}</script>
<script id="silk-sphere-cells" type="application/json">${JSON.stringify(cells).replace(/<\//g, '<\\/')}</script>
<script id="silk-sphere-grid" type="application/json">${JSON.stringify(grid).replace(/<\//g, '<\\/')}</script>
<script id="silk-cell-registry-v2-source">${registry.replace(/<\//g, '<\\/')}</script>
<script id="silk-world-sphere-v2-source">${sphere.replace(/<\//g, '<\\/')}</script>
<script id="silk-world-sphere-v2-adapter">${adapter.replace(/<\//g, '<\\/')}</script>
<script id="silk-v2-self-test-source">${selfTest.replace(/<\//g, '<\\/')}</script>`;
candidate = candidate.replace(/<\/body>/i, () => `${injection}</body>`);
fs.writeFileSync(outputPath, candidate, 'utf8');
fs.writeFileSync(compatibilityOutputPath, candidate, 'utf8');
console.log(JSON.stringify({
  output: outputPath,
  compatibilityOutput: compatibilityOutputPath,
  bytes: Buffer.byteLength(candidate),
  worldId: worldPackage.world_id,
  subjects: worldPackage.subjects.length,
  relations: worldPackage.relations.length,
  cells: built.cells.length,
  countries: cells.countries.length,
  settlements: cells.settlements.length
}, null, 2));
