'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const next = path.resolve(__dirname, '..');
const candidatePath = path.join(next, 'SILK-V2.html');
const compatibilityPath = path.join(next, 'SILK-V2-NEXT.html');
const reportPath = path.join(next, 'STATIC_AUDIT.json');
const browserEvidencePath = path.join(next, 'BROWSER_VALIDATION.json');
const candidateReportPath = 'v2.next/SILK-V2.html';
const browserEvidenceReportPath = 'v2.next/BROWSER_VALIDATION.json';
const html = fs.readFileSync(candidatePath, 'utf8');
const candidateSha256 = crypto.createHash('sha256').update(html).digest('hex').toUpperCase();
const failures = [];
const scripts = [];
const pattern = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let match;
while ((match = pattern.exec(html))) {
  if (/type=["']application\/json["']/i.test(match[1])) continue;
  if (/\bsrc=/i.test(match[1])) continue;
  scripts.push(match[2]);
}

scripts.forEach((source, index) => {
  try { new Function(source); } catch (error) { failures.push(`script ${index + 1} syntax: ${error.message}`); }
});

const checks = {
  marker: html.includes('id="sphereWorldMount"') && html.includes('id="sphereWorldRail"'),
  worldApi: html.includes('window.SILK_WORLD_SPHERE ='),
  selectionApi: html.includes('window.SILK_SELECTION ='),
  surfaceStyle: /data-world-visual="terrain"[^>]*>SURFACE/.test(html),
  whiteStyle: /data-world-visual="loom"[^>]*>WHITE/.test(html),
  atlasGraph: html.includes('id="connectionsCanvas"'),
  atlasReader: html.includes('id="atlasReaderArticlePane"') && html.includes('id="atlasReaderSubjectPane"'),
  cellEditor: html.includes('data-sphere-tool="terrain"') && html.includes('data-sphere-tool="owner"') && html.includes('id="sphereUndo"'),
  worldRailTabs: html.includes('data-sphere-rail-tab="display"') && html.includes('data-sphere-rail-tab="edit"'),
  displayLayers: html.includes('data-sphere-layer="borders"') && html.includes('data-sphere-layer="countryLabels"') && html.includes('data-sphere-layer="cities"'),
  atlasSingleClick: html.includes('ATLAS single-click selection is owned by V2.NEXT'),
  readerResponsiveTitle: /\.atlas-reader-index-header strong[^}]*white-space:normal/.test(html),
  atlasSharedRail: html.includes('id="atlasSharedRail"') && html.includes('installAtlasSharedRail') && html.includes('data-atlas-rail-surface="reader"'),
  oldMapEditorRemoved: !html.includes('id="flatCanvas"') && !html.includes('class="rail-editor-entry"'),
  legacyWorldInactive: !/globeRenderer\s*=\s*createGlobeRenderer\s*\(/.test(html) && !/loomRenderer\s*=\s*createGeographicLoomRenderer\s*\(/.test(html) && !/flatRenderer\s*=\s*createFlatMap\s*\(/.test(html),
  noVisibleLoomTab: !/<button[^>]+data-world-visual="loom"[^>]*>[\s\S]{0,80}\bLOOM\b/i.test(html),
  secretLoomFunctionalCopy: html.includes('WORLD RELATION SPHERE') && html.includes('世界設定の主題と関係を球面グラフで表示します'),
  secretLoomExitsThroughMainModes: html.includes('.mode-button[data-mode="world"], .mode-button[data-mode="connections"]'),
  noProjectSpecificWorld: !/(arnebia|アルネビア|lunaris|ルナリス|blackwater|sablemouth|saltwind|greybell|グレイベル|湾岸戦争)/i.test(html),
  noDevelopmentFacingCopy: !/(正本の地理制約|旧MAP EDITOR|BUILD SOURCE|GEOGRAPHIC INTENT|HIDDEN SURFACE|WOVEN WORLD-BODY|点を作り、縦に掘り)/i.test(html),
  dynamicProjectLoad: html.includes('silk:project-loaded') && html.includes('deriveSphereData'),
  cellTransactions: html.includes('applyCellTransaction') && html.includes('undoCellTransaction') && html.includes('redoCellTransaction'),
  terrainLegend: html.includes('biome_legend') && html.includes('relief?.biomes'),
  gpuWhiteGrid: html.includes('gl.drawArrays(gl.LINES'),
  semanticZoom: html.includes('semanticPolicyForZoom'),
  startupSelfTest: html.includes('window.SILK_V2_SELF_TEST =') && html.includes('V2 CHECK FAILED')
};
for (const [name, passed] of Object.entries(checks)) if (!passed) failures.push(`check failed: ${name}`);

const cellMatch = html.match(/<script[^>]+id="silk-sphere-cells"[^>]*>([\s\S]*?)<\/script>/i);
const gridMatch = html.match(/<script[^>]+id="silk-sphere-grid"[^>]*>([\s\S]*?)<\/script>/i);
const packageMatch = html.match(/<script[^>]+id="silk-world-package"[^>]*>([\s\S]*?)<\/script>/i);
const cellData = cellMatch ? JSON.parse(cellMatch[1]) : null;
const gridData = gridMatch ? JSON.parse(gridMatch[1]) : null;
const packageData = packageMatch ? JSON.parse(packageMatch[1]) : null;
if (!cellData || !gridData) failures.push('embedded sphere data missing');
const gridCellCount = gridData?.cells?.length ?? gridData?.cell_count ?? 0;
if (cellData && gridData && cellData.terrain.length !== gridCellCount) failures.push('sphere grid/data length mismatch');
if (!packageData) failures.push('embedded world package missing');
if (packageData && packageData.world_id !== 'starter_world') failures.push('plain world_id is not starter_world');
if (packageData && packageData.subjects?.length !== 1) failures.push('plain package must contain one guide subject');
if (packageData && packageData.relations?.length !== 0) failures.push('plain package must contain zero relations');
if (cellData && cellData.countries?.length !== 0) failures.push('plain cells must contain zero countries');
if (cellData && cellData.settlements?.length !== 0) failures.push('plain cells must contain zero settlements');
if (cellData && cellData.owners?.some(owner => owner !== -1)) failures.push('plain cells must be unowned');
if (cellData && cellData.terrain?.some(terrain => terrain !== 'ocean')) failures.push('plain cells must start as ocean');
if (!fs.existsSync(compatibilityPath) || fs.readFileSync(compatibilityPath, 'utf8') !== html) failures.push('compatibility candidate differs from release candidate');

let browserValidation = { status: 'MISSING', evidence: browserEvidenceReportPath };
if (fs.existsSync(browserEvidencePath)) {
  try {
    const evidence = JSON.parse(fs.readFileSync(browserEvidencePath, 'utf8'));
    browserValidation = evidence.candidate_sha256 === candidateSha256 ? evidence : { ...evidence, status: 'STALE', current_candidate_sha256: candidateSha256 };
  } catch (error) {
    browserValidation = { status: 'INVALID', evidence: browserEvidenceReportPath, error: error.message };
  }
}
if (browserValidation.status !== 'PASS') failures.push(`browser validation is ${browserValidation.status}`);

const reportBody = {
  ok: failures.length === 0,
  candidate: candidateReportPath,
  sha256: candidateSha256,
  bytes: Buffer.byteLength(html),
  inline_scripts_parsed: scripts.length,
  checks,
  data: cellData && gridData ? {
    cells: gridCellCount,
    countries: cellData.countries.length,
    settlements: cellData.settlements.length,
    borders: cellData.borders.length,
    world_id: packageData?.world_id || null,
    subjects: packageData?.subjects?.length || 0,
    relations: packageData?.relations?.length || 0
  } : null,
  failures,
  browser_validation: browserValidation
};
let generatedAt = new Date().toISOString();
if (fs.existsSync(reportPath)) {
  try {
    const previous = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const { generated_at: previousGeneratedAt, ...previousBody } = previous;
    if (previousGeneratedAt && JSON.stringify(previousBody) === JSON.stringify(reportBody)) generatedAt = previousGeneratedAt;
  } catch {
    // Invalid prior output is replaced by the current audit.
  }
}
const report = { ok: reportBody.ok, generated_at: generatedAt, ...Object.fromEntries(Object.entries(reportBody).filter(([key]) => key !== 'ok')) };
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
