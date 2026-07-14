(function (root, factory) {
  const exported = factory();
  if (typeof module === 'object' && module.exports) module.exports = exported;
  if (root && root.document) exported.install(root);
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function evaluateSnapshot(snapshot) {
    const failures = [];
    if (JSON.stringify(snapshot.productModes) !== JSON.stringify(['world', 'connections'])) failures.push('product modes must be WORLD and ATLAS only');
    if (JSON.stringify(snapshot.worldStyles) !== JSON.stringify(['SURFACE', 'WHITE'])) failures.push('WORLD styles must be SURFACE and WHITE');
    if (!snapshot.requiredDom) failures.push('required DOM is missing');
    if (!snapshot.requiredApis) failures.push('required public APIs are missing');
    if (!snapshot.mapTransactions) failures.push('map and cell transactions are incomplete');
    if (!snapshot.atlasReader) failures.push('ATLAS Reader is unavailable');
    if (!snapshot.legacyWorldHidden) failures.push('legacy WORLD canvases are visible');
    if (snapshot.sphere?.available !== false) {
      if (!['webgl2', 'canvas2d'].includes(snapshot.sphere?.renderer)) failures.push('sphere renderer is unavailable');
      if (!(Number(snapshot.sphere?.cells) > 0)) failures.push('sphere cells are missing');
      if (Number(snapshot.sphere?.meshBuilds) !== 1) failures.push('sphere mesh must be built exactly once');
    }
    if (snapshot.runtimeErrors?.length) failures.push(`runtime errors: ${snapshot.runtimeErrors.length}`);
    return { ok: failures.length === 0, failures, snapshot, checked_at: new Date().toISOString() };
  }

  function install(window) {
    const runtimeErrors = [];
    let lastResult = null;
    window.addEventListener('error', (event) => runtimeErrors.push(String(event.error?.message || event.message || 'window error')));
    window.addEventListener('unhandledrejection', (event) => runtimeErrors.push(String(event.reason?.message || event.reason || 'unhandled rejection')));

    function buildSnapshot() {
      const productModes = [...document.querySelectorAll('.mode-switch [data-mode]')].map((button) => button.dataset.mode);
      const worldStyles = [...document.querySelectorAll('#worldStyleSwitch [data-world-visual]')].map((button) => button.textContent.includes('SURFACE') ? 'SURFACE' : button.textContent.includes('WHITE') ? 'WHITE' : button.textContent.trim());
      const requiredIds = ['worldView', 'flatView', 'connectionsView', 'connectionsCanvas', 'atlasReaderArticlePane', 'atlasReaderSubjectPane', 'inspectorContent', 'worldStyleSwitch'];
      const oldCanvases = ['globeCanvas', 'globeOverlay', 'loomCanvas'].map((id) => document.getElementById(id)).filter(Boolean);
      const map = window.SILK_MAP || {}, atlas = window.SILK_ATLAS || {}, reader = window.SILK_READER || {};
      return {
        productModes,
        worldStyles,
        requiredDom: requiredIds.every((id) => document.getElementById(id)),
        requiredApis: Boolean(window.SILK_MAP && window.SILK_ATLAS && window.SILK_READER && window.SILK_PROJECT && window.SILK_WORLD_SPHERE),
        mapTransactions: ['validateTransaction', 'previewTransaction', 'applyTransaction', 'undo', 'redo', 'applyCellTransaction', 'undoCellTransaction', 'redoCellTransaction'].every((method) => typeof map[method] === 'function'),
        atlasReader: typeof atlas.focusNode === 'function' && typeof reader.openSubject === 'function',
        legacyWorldHidden: oldCanvases.every((canvas) => canvas.hidden || window.getComputedStyle(canvas).display === 'none'),
        sphere: window.SILK_WORLD_SPHERE?.getDiagnostics?.() || null,
        runtimeErrors: [...runtimeErrors]
      };
    }

    function run() {
      lastResult = evaluateSnapshot(buildSnapshot());
      window.__SILK_V2_SELF_TEST_RESULT__ = lastResult;
      if (!lastResult.ok) {
        const status = document.getElementById('topStatus');
        if (status) {
          status.style.background = '#ec6a42';
          status.querySelector('b').textContent = 'V2 CHECK FAILED';
          status.querySelector('small').textContent = lastResult.failures[0];
          status.title = lastResult.failures.join('\n');
        }
      }
      document.dispatchEvent(new CustomEvent('silk:v2-self-test', { detail: lastResult }));
      return lastResult;
    }

    window.SILK_V2_SELF_TEST = Object.freeze({ run, getLastResult: () => lastResult, getRuntimeErrors: () => [...runtimeErrors] });
    document.addEventListener('silk:world-sphere-ready', () => setTimeout(run, 0));
    document.addEventListener('silk:project-loaded', () => setTimeout(run, 0));
    if (window.SILK_WORLD_SPHERE) queueMicrotask(run);
  }

  return { evaluateSnapshot, install };
});
