(function (root, factory) {
  const exported = factory();
  if (typeof module === 'object' && module.exports) module.exports = exported;
  if (root && root.document) exported.boot(root);
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function createSelectionBus() {
    let state = { id: null, source: null };
    const subscribers = new Set();
    return {
      select(id, source) {
        if (!id || id === state.id) return;
        state = { id, source: source || 'unknown' };
        subscribers.forEach((subscriber) => subscriber({ ...state }));
      },
      clear(source) { if (state.id == null) return; state = { id: null, source: source || 'unknown' }; subscribers.forEach((subscriber) => subscriber({ ...state })); },
      subscribe(subscriber) { subscribers.add(subscriber); return () => subscribers.delete(subscriber); },
      getState() { return { ...state }; }
    };
  }

  function parseScript(id) {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing embedded data: ${id}`);
    return JSON.parse(node.textContent);
  }

  function spherePointFromFeature(feature, registry) {
    const coordinates = feature?.geometry?.coordinates;
    if (!Array.isArray(coordinates)) return null;
    if (coordinates.length >= 3) {
      const m = Math.hypot(coordinates[0], coordinates[1], coordinates[2]) || 1;
      return [coordinates[0] / m, coordinates[1] / m, coordinates[2] / m];
    }
    const patch = registry?.terrain_blueprint?.patch || registry?.terrain_blueprint || {};
    const center = patch.center || [0, 0]; const span = patch.span || patch.extent || [100, 70];
    const lon = Number(center[0] || 0) + (Number(coordinates[0]) - .5) * Number(span[0] || 100);
    const lat = Number(center[1] || 0) + (.5 - Number(coordinates[1])) * Number(span[1] || 70);
    const lo = lon * Math.PI / 180, la = lat * Math.PI / 180;
    return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
  }

  function isGeographicPackage(pkg) {
    const profile = pkg?.rendererProfile || pkg?.spatial_registry?.renderer_profile || {};
    const route = pkg?.integration?.renderer || {};
    const primary = String(route.primary || profile.primary || '').toLowerCase();
    const space = String(pkg?.spaceModel?.type || pkg?.spatial_registry?.space_model?.type || '').toLowerCase();
    if (/atlas|network|graph/.test(primary) && !/globe|map/.test(primary)) return false;
    if (/galaxy|stellar|dungeon|layer|abstract|network|timeline/.test(space)) return false;
    return /globe|map|geograph/.test(primary) || /continent|planet|world|geograph|territor/.test(space);
  }

  function pointInRing(point, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if (!Array.isArray(a) || !Array.isArray(b)) continue;
      const crossing = (a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / ((b[1] - a[1]) || 1e-9) + a[0];
      if (crossing) inside = !inside;
    }
    return inside;
  }

  function geometryContains(geometry, point) {
    if (geometry?.type === 'Polygon') return pointInRing(point, geometry.coordinates?.[0] || []);
    if (geometry?.type === 'MultiPolygon') return (geometry.coordinates || []).some((polygon) => pointInRing(point, polygon?.[0] || []));
    return false;
  }

  function localPointForCell(center, registry) {
    const patch = registry?.terrain_blueprint?.patch || registry?.terrain_blueprint || {};
    const origin = patch.center || [0, 0], span = patch.span || patch.extent || [360, 180];
    const lon = Math.atan2(center[0], center[2]) * 180 / Math.PI;
    const lat = Math.asin(Math.max(-1, Math.min(1, center[1]))) * 180 / Math.PI;
    return [.5 + (lon - Number(origin[0] || 0)) / Number(span[0] || 360), .5 - (lat - Number(origin[1] || 0)) / Number(span[1] || 180)];
  }

  function validateSphericalData(data, grid) {
    const errors = [];
    if (!Array.isArray(data?.terrain) || data.terrain.length !== grid.cells.length) errors.push('terrain length mismatch');
    if (!Array.isArray(data?.owners) || data.owners.length !== grid.cells.length) errors.push('owners length mismatch');
    if (!Array.isArray(data?.countries)) errors.push('countries missing');
    if (Array.isArray(data?.owners) && Array.isArray(data?.countries) && data.owners.some((owner) => !Number.isInteger(owner) || owner < -1 || owner >= data.countries.length)) errors.push('owner index out of range');
    if (data?.relief?.elevation && (!Array.isArray(data.relief.elevation) || data.relief.elevation.length !== grid.cells.length)) errors.push('relief length mismatch');
    if (data?.settlements && !Array.isArray(data.settlements)) errors.push('settlements must be an array');
    return { ok: errors.length === 0, errors };
  }

  function deriveSphereData(pkg, registry, grid) {
    const explicit = pkg?.spherical_cells || pkg?.world?.spherical_cells || registry?.spherical_cells;
    if (explicit && validateSphericalData(explicit, grid).ok) {
      return { available: true, source: 'spherical_cells', data: explicit };
    }
    if (!isGeographicPackage(pkg)) return { available: false, source: 'not_geographic', reason: 'This world does not use a geographic renderer.' };
    const features = registry?.features || pkg?.features || [];
    const subjects = new Map((pkg?.subjects || []).map((subject) => [subject.id, subject]));
    const polygons = features.filter((feature) => ['Polygon', 'MultiPolygon'].includes(feature?.geometry?.type));
    if (!polygons.length) return { available: false, source: 'missing_spatial_data', reason: 'No Polygon or MultiPolygon geography exists in the Spatial Registry.' };
    const palette = ['#b74338', '#d29f35', '#6f8e45', '#36788a', '#81629b', '#b86c36', '#5c7c9c', '#9a7953', '#7d9247', '#b24f65'];
    const countries = polygons.map((feature, index) => {
      const id = feature.subject_id || feature.properties?.subject_id || feature.id;
      const subject = subjects.get(id) || {};
      return { id, name: subject.name || subject.title || feature.properties?.name || feature.name || id, color: feature.properties?.color || feature.style?.fill || palette[index % palette.length], point: [0, 0, 1], cells: 0, feature };
    });
    const owners = new Array(grid.cells.length).fill(-1);
    const terrain = new Array(grid.cells.length).fill(0);
    grid.cells.forEach((cell, index) => {
      const local = localPointForCell(cell.center, registry);
      const owner = countries.findIndex((country) => geometryContains(country.feature.geometry, local));
      if (owner >= 0) { owners[index] = owner; terrain[index] = 2; }
    });
    countries.forEach((country, owner) => {
      const owned = grid.cells.filter((_, index) => owners[index] === owner);
      country.cells = owned.length;
      if (owned.length) {
        const sum = owned.reduce((acc, cell) => [acc[0] + cell.center[0], acc[1] + cell.center[1], acc[2] + cell.center[2]], [0, 0, 0]);
        const magnitude = Math.hypot(...sum) || 1; country.point = sum.map((value) => value / magnitude);
      }
      delete country.feature;
    });
    const settlements = features.filter((feature) => feature?.geometry?.type === 'Point').map((feature) => {
      const id = feature.subject_id || feature.properties?.subject_id || feature.id;
      const subject = subjects.get(id) || {};
      const point = spherePointFromFeature(feature, registry);
      const local = feature.geometry.coordinates;
      const owner = countries.findIndex((country, index) => geometryContains(polygons[index]?.geometry, local));
      return { id, name: subject.name || subject.title || feature.properties?.name || feature.name || id, role: feature.properties?.role || feature.kind || 'settlement', parent: owner >= 0 ? countries[owner].id : null, owner, resolvedOwner: owner, point, importance: Number(feature.properties?.importance || subject.importance || 55), status: feature.status || 'derived' };
    }).filter((place) => Array.isArray(place.point));
    const borders = (grid.dualEdges || []).flatMap((edge) => {
      const left = owners[edge.cells[0]], right = owners[edge.cells[1]];
      const leftLand = terrain[edge.cells[0]] > 0, rightLand = terrain[edge.cells[1]] > 0;
      if (left === right && leftLand === rightLand) return [];
      if (!leftLand && !rightLand) return [];
      return [{ a: grid.faceCenters[edge.faces[0]], b: grid.faceCenters[edge.faces[1]], left, right, kind: leftLand && rightLand ? 'frontier' : 'coast', elevation: 0 }];
    });
    const countryLabelLayout = countries.map((country, index) => ({ id: country.id, short_name: country.name, anchor: country.point, cell_count: country.cells, priority: Math.min(100, 50 + country.cells), archipelago: false }));
    return { available: true, source: 'spatial_registry', data: {
      format: 'silk-spherical-cells-derived-v1', version: '2.next', world_id: pkg.world_id,
      frequency: grid.frequency, terrain, terrain_legend: { 0: 'ocean', 2: 'grassland' }, owners, countries, borders, settlements,
      country_label_layout: countryLabelLayout,
      label_policy: { zoom: { minimum: .66, maximum: 2.4, medium_end: 1.35, near_end: 1.7, detail_start: 1.7 }, far: { settlement_name_importance: 101, settlement_label_budget: 0 }, medium: { settlement_name_importance: 95, settlement_label_budget: 10 }, near: { settlement_name_importance: 60, settlement_label_budget: 22 }, detail: { settlement_name_importance: 0, settlement_label_budget: 48 } },
      relief: { height_scale: 0, elevation: new Array(grid.cells.length).fill(0) }
    }};
  }

  function boot(window) {
    let pendingPackage = null;
    let applyProject = null;
    document.addEventListener('silk:project-loaded', (event) => {
      pendingPackage = event.detail?.package || null;
      if (pendingPackage && applyProject) applyProject(pendingPackage);
    });
    const wait = () => {
      if (!window.SILK_WORLD_SPHERE_FACTORY || !window.SILK_MAP || !window.SILK_ATLAS || !window.SILK_READER) return setTimeout(wait, 40);
      const worldView = document.getElementById('worldView');
      if (!worldView || worldView.dataset.sphereReady === 'true') return;
      const sphereMount = document.getElementById('sphereWorldMount') || worldView;
      let data = parseScript('silk-sphere-cells'); const embeddedData = data; const grid = window.SILK_WORLD_SPHERE_FACTORY.unpackGrid(parseScript('silk-sphere-grid'));
      const bus = createSelectionBus();
      const baseAtlas = window.SILK_ATLAS;
      const baseReader = window.SILK_READER;
      const baseMap = window.SILK_MAP;
      const atlasApi = { ...baseAtlas };
      if (typeof baseAtlas.focusNode === 'function') atlasApi.focusNode = (id, options) => { const result = baseAtlas.focusNode(id, options); bus.select(id, 'atlas'); return result; };
      if (typeof baseAtlas.clearFocus === 'function') atlasApi.clearFocus = (...args) => { const result = baseAtlas.clearFocus(...args); bus.clear('atlas'); return result; };
      const readerApi = { ...baseReader };
      if (typeof baseReader.openSubject === 'function') readerApi.openSubject = (id, options) => { const result = baseReader.openSubject(id, options); bus.select(id, 'reader'); return result; };
      try { window.SILK_ATLAS = Object.freeze(atlasApi); window.SILK_READER = Object.freeze(readerApi); } catch (_) { /* retain host APIs if globals are locked */ }

      function installAtlasSharedRail() {
        const shared = document.getElementById('atlasSharedRail');
        const graphPanel = document.getElementById('atlasRailGraphPanel');
        const readerPanel = document.getElementById('atlasRailReaderPanel');
        const graphRail = document.getElementById('connectionsRail');
        const categories = document.getElementById('atlasReaderCategoryPane');
        const app = document.getElementById('app');
        if (!shared || !graphPanel || !readerPanel || !graphRail || !categories || !app) return null;
        graphPanel.append(graphRail);
        readerPanel.append(categories);
        readerPanel.addEventListener('click', (event) => {
          const category = event.target.closest('[data-reader-collection]');
          if (!category || !readerPanel.contains(category)) return;
          const reader = window.SILK_READER;
          if (!reader || typeof reader.selectCollection !== 'function') return;
          reader.selectCollection(category.dataset.readerCollection);
        });
        const sync = () => {
          const surface = app.dataset.atlasSurface === 'reader' ? 'reader' : 'graph';
          shared.querySelectorAll('[data-atlas-rail-surface]').forEach((button) => { const active = button.dataset.atlasRailSurface === surface; button.classList.toggle('is-active', active); button.setAttribute('aria-selected', String(active)); });
          graphPanel.hidden = surface !== 'graph';
          readerPanel.hidden = surface !== 'reader';
        };
        shared.querySelectorAll('[data-atlas-rail-surface]').forEach((button) => button.addEventListener('click', () => {
          document.querySelector(`.atlas-surface-switch [data-atlas-surface="${button.dataset.atlasRailSurface}"]`)?.click();
          queueMicrotask(sync);
        }));
        new MutationObserver(sync).observe(app, { attributes: true, attributeFilter: ['data-atlas-surface'] });
        sync();
        return shared;
      }
      const atlasSharedRail = installAtlasSharedRail();
      const featureForSphereId = (id) => baseMap.getSpatialRegistry?.()?.features?.find((item) => item.id === `spatial.${id}` || item.id === id);
      const canonicalIdFor = (id) => featureForSphereId(id)?.subject_id || id;
      const sphereIdForCanonical = (id) => {
        const feature = baseMap.getSpatialRegistry?.()?.features?.find((item) => item.subject_id === id);
        return feature?.id?.replace(/^spatial\./, '') || id;
      };
      const onSelect = (id) => bus.select(canonicalIdFor(id), 'world');
      const readout = document.getElementById('sphereCellReadout');
      const onCellInspect = (index) => {
        const owner = data.owners[index], country = data.countries?.[owner];
        const biomeCode = window.SILK_WORLD_SPHERE_FACTORY.biomeForCell(data, index);
        const biome = data.biome_legend?.[biomeCode] || biomeCode || 'ocean';
        if (readout) readout.textContent = `CELL ${index} / ${country?.name || 'UNCLAIMED'} / ${biome} / H${data.relief?.elevation?.[index] || 0}`;
      };
      let cellStore;
      const onCellEdit = (transaction) => cellStore?.apply(transaction);
      let sphere = window.SILK_WORLD_SPHERE_FACTORY.createSphere({ container: sphereMount, data, grid, onSelect, onCellInspect, onCellEdit });
      cellStore = window.SILK_CELL_REGISTRY.createCellRegistryStore(data, grid, (change) => {
        refreshCellSphere(cellStore.getDataRef());
        document.dispatchEvent(new CustomEvent('silk:cell-registry-change', { detail: { ...change, state: cellStore.getState() } }));
      });
      const sphereOverlay = document.getElementById('silkSphereOverlay');
      if (sphereOverlay) {
        sphereOverlay.tabIndex = 0;
        sphereOverlay.setAttribute('role', 'application');
        sphereOverlay.setAttribute('aria-label', 'WORLD球体。矢印キーでセル移動、スペースで現在の編集を適用、プラスとマイナスでズーム、Homeで視点を戻します。');
        sphereOverlay.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight ArrowUp ArrowDown Space + - Home');
        sphereOverlay.addEventListener('keydown', (event) => {
          const selected = sphere.getState().editor.selectedCell;
          const origin = Number.isInteger(selected) ? selected : 0;
          const jump = Math.max(1, Number(grid.frequency || 1));
          const deltas = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -jump, ArrowDown: jump };
          if (event.key in deltas) { event.preventDefault(); sphere.selectCell(origin + deltas[event.key]); return; }
          if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); sphere.activateSelectedCell(); return; }
          if (event.key === '+' || event.key === '=') { event.preventDefault(); sphere.zoomBy(1.16); return; }
          if (event.key === '-' || event.key === '_') { event.preventDefault(); sphere.zoomBy(1 / 1.16); return; }
          if (event.key === 'Home') { event.preventDefault(); sphere.reset({ animate: true }); }
        });
      }
      let worldAvailable = true;
      let worldSource = 'embedded';
      let currentPackage = null;
      let polygonSignature = '';
      const unavailable = document.createElement('div'); unavailable.className = 'silk-world-unavailable'; unavailable.hidden = true;
      unavailable.innerHTML = '<strong>WORLD MAP NOT AVAILABLE</strong><span></span>'; sphereMount.append(unavailable);
      worldView.dataset.sphereReady = 'true'; worldView.dataset.sphereStyle = 'surface';
      const styleSwitch = document.getElementById('worldStyleSwitch');
      const terrain = styleSwitch?.querySelector('[data-world-visual="terrain"]');
      const white = styleSwitch?.querySelector('[data-world-visual="loom"]');
      if (terrain) terrain.innerHTML = 'SURFACE<small>地形・国境・都市</small>';
      if (white) white.innerHTML = 'WHITE<small>セル・国境・主要ノード</small>';
      const editor = { tool: 'inspect', terrain: 'grassland', owner: 0, brush: 0 };
      let activeRailTab = 'display';
      const setRailTab = (value) => {
        activeRailTab = value === 'edit' ? 'edit' : 'display';
        document.querySelectorAll('[data-sphere-rail-tab]').forEach((button) => { const active = button.dataset.sphereRailTab === activeRailTab; button.classList.toggle('is-active', active); button.setAttribute('aria-selected', String(active)); });
        document.querySelectorAll('[data-sphere-rail-panel]').forEach((panel) => { panel.hidden = panel.dataset.sphereRailPanel !== activeRailTab; });
        sphere.setEditor({ ...editor, tool: activeRailTab === 'edit' ? editor.tool : 'inspect' });
      };
      document.querySelectorAll('[data-sphere-rail-tab]').forEach((button) => button.addEventListener('click', () => setRailTab(button.dataset.sphereRailTab)));
      const syncLayerControls = () => {
        const layers = sphere.getState().layers;
        document.querySelectorAll('[data-sphere-layer]').forEach((button) => button.setAttribute('aria-pressed', String(Boolean(layers[button.dataset.sphereLayer]))));
      };
      document.querySelectorAll('[data-sphere-layer]').forEach((button) => button.addEventListener('click', () => { const key = button.dataset.sphereLayer; sphere.setLayers({ [key]: !sphere.getState().layers[key] }); syncLayerControls(); }));
      const layerPresets = { all: { borders: true, countryLabels: true, cities: true }, terrain: { borders: false, countryLabels: false, cities: false }, political: { borders: true, countryLabels: true, cities: false }, cities: { borders: true, countryLabels: false, cities: true } };
      document.querySelectorAll('[data-sphere-preset]').forEach((button) => button.addEventListener('click', () => { sphere.setLayers(layerPresets[button.dataset.spherePreset]); syncLayerControls(); }));
      syncLayerControls();

      function currentMode() {
        const active = document.querySelector('.mode-switch [data-mode].is-active, .mode-switch [data-mode].active, .mode-switch [data-mode][aria-pressed="true"]');
        if (active) return active.dataset.mode;
        if (!document.getElementById('connectionsView')?.hidden) return 'connections';
        return 'world';
      }
      let previousMode = null;
      function syncVisibility() {
        const mode = currentMode();
        worldView.hidden = mode !== 'world';
        const worldRail = document.getElementById('sphereWorldRail');
        const atlasRail = atlasSharedRail || document.getElementById('connectionsRail');
        if (worldRail) worldRail.hidden = mode !== 'world';
        if (atlasRail) atlasRail.hidden = mode !== 'connections';
        sphere.setVisible(mode === 'world' && worldAvailable);
        unavailable.hidden = !(mode === 'world' && !worldAvailable);
        previousMode = mode;
      }
      function setWorldStyle(value) {
        const style = value === 'white' ? 'white' : 'surface';
        [terrain, white].filter(Boolean).forEach((button) => {
          const active = button === (style === 'white' ? white : terrain);
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', String(active));
        });
        worldView.dataset.sphereStyle = style;
        sphere.setStyle(style);
      }
      function syncStyle() { setWorldStyle(white?.classList.contains('is-active') || white?.classList.contains('active') || white?.getAttribute('aria-pressed') === 'true' ? 'white' : 'surface'); }

      bus.subscribe(({ id, source }) => {
        const sphereId = sphereIdForCanonical(id);
        sphere.selectSubject(sphereId);
        if (source === 'world') {
          baseAtlas.focusNode?.(id, { history: false });
        }
        if (currentMode() === 'connections' && source !== 'atlas') window.SILK_ATLAS.focusNode?.(id, { history: false });
      });

      document.addEventListener('click', (event) => {
        const mode = event.target.closest?.('[data-mode]');
        const visual = event.target.closest?.('[data-world-visual]');
        const overview = event.target.closest?.('[data-action="overview"]');
        const action = event.target.closest?.('[data-action]')?.dataset.action;
        if (overview && currentMode() === 'world') {
          event.preventDefault();
          event.stopImmediatePropagation();
          sphere.reset({ animate: true, duration: 650 });
          return;
        }
        if (mode || visual) sphere.setAutoRotate(false);
        queueMicrotask(() => {
          if (mode) {
            syncVisibility();
            if (mode.dataset.mode === 'connections') { const id = bus.getState().id; if (id) window.SILK_ATLAS.focusNode?.(id, { history: false }); }
          }
          if (visual) setWorldStyle(visual.dataset.worldVisual === 'loom' ? 'white' : 'surface');
        });
        if (currentMode() !== 'world') return;
        if (action === 'zoom-in') sphere.zoomBy(1.16);
        if (action === 'zoom-out') sphere.zoomBy(1 / 1.16);
        if (action === 'reset-camera') sphere.reset();
        if (action === 'toggle-rotation') sphere.setAutoRotate(!sphere.getState().autoRotate);
      }, true);

      const observer = new MutationObserver(() => { syncVisibility(); });
      [document.querySelector('.mode-switch'), document.getElementById('connectionsView')].filter(Boolean).forEach((node) => observer.observe(node, { attributes: true, subtree: true, attributeFilter: ['class', 'hidden', 'aria-pressed', 'data-mode'] }));

      let lastAtlas = null;
      document.getElementById('connectionsView')?.addEventListener('click', () => queueMicrotask(() => {
        const readerActive = document.querySelector('[data-atlas-surface="reader"].is-active');
        const id = readerActive ? window.SILK_READER.getState?.().subjectId : window.SILK_ATLAS.getState?.().selectedId;
        if (id && id !== lastAtlas) { lastAtlas = id; bus.select(id, 'atlas'); }
      }));

      const signatureFor = (registry) => JSON.stringify((registry?.features || []).filter((feature) => ['Polygon', 'MultiPolygon'].includes(feature?.geometry?.type)).map((feature) => [feature.id, feature.geometry]));
      function refreshCellSphere(nextData) {
        data = nextData; worldSource = 'cell_transaction'; sphere.refresh(nextData);
        const selectedCell = sphere.getState().editor?.selectedCell;
        if (Number.isInteger(selectedCell)) onCellInspect(selectedCell);
      }
      const refreshFromRegistry = () => {
        const registry = baseMap.getSpatialRegistry?.();
        if (!registry) return;
        const signature = signatureFor(registry);
        if (currentPackage && signature !== polygonSignature) {
          polygonSignature = signature;
          const pkg = { ...currentPackage, spherical_cells: null, world: { ...(currentPackage.world || {}), spherical_cells: null }, spatial_registry: { ...registry, spherical_cells: null } };
          const result = deriveSphereData(pkg, pkg.spatial_registry, grid);
          if (result.available) { remountSphere(result.data, 'spatial_registry', true); return; }
        }
        const settlements = data.settlements.map((place) => {
          const feature = registry.features?.find((item) => item.subject_id === place.id || item.id === place.id);
          const point = spherePointFromFeature(feature, registry);
          return point ? { ...place, point } : place;
        });
        data = { ...data, settlements }; sphere.refresh(data);
      };
      function remountSphere(nextData, source, resetStore = true) {
        const previous = sphere.getState();
        sphere.destroy(); data = nextData; worldSource = source; worldAvailable = true;
        if (resetStore) cellStore = window.SILK_CELL_REGISTRY.createCellRegistryStore(data, grid, () => refreshCellSphere(cellStore.getDataRef()));
        sphere = window.SILK_WORLD_SPHERE_FACTORY.createSphere({ container: sphereMount, data, grid, onSelect, onCellInspect, onCellEdit });
        sphere.setStyle(previous.style); sphere.setCamera(previous); sphere.selectSubject(sphereIdForCanonical(bus.getState().id)); sphere.setAutoRotate(previous.autoRotate); sphere.setEditor(previous.editor);
        if (Number.isInteger(previous.editor?.selectedCell)) onCellInspect(previous.editor.selectedCell);
        unavailable.hidden = true; syncVisibility();
      }

      applyProject = (pkg) => {
        const registry = pkg?.spatial_registry || {};
        currentPackage = pkg; polygonSignature = signatureFor(registry);
        const explicit = pkg?.spherical_cells || pkg?.world?.spherical_cells || registry.spherical_cells;
        let result;
        if (explicit) result = deriveSphereData(pkg, registry, grid);
        else if (pkg?.world_id === embeddedData.world_id) result = { available: true, source: 'embedded', data: embeddedData };
        else result = deriveSphereData(pkg, registry, grid);
        if (!result.available) {
          worldAvailable = false; worldSource = result.source; sphere.setVisible(false);
          unavailable.querySelector('span').textContent = result.reason || 'This project has no compatible geographic data.';
          syncVisibility(); return result;
        }
        if (result.data === data && worldAvailable) { worldSource = result.source; syncVisibility(); return result; }
        remountSphere(result.data, result.source); return result;
      };
      const wrapped = { ...baseMap };
      for (const method of ['applyTransaction', 'undo', 'redo', 'importWorldPackage', 'importSpatialRegistry']) {
        if (typeof baseMap[method] !== 'function') continue;
        wrapped[method] = (...args) => { const result = baseMap[method](...args); Promise.resolve(result).finally(refreshFromRegistry); return result; };
      }
      wrapped.getCellRegistry = () => cellStore.exportData();
      wrapped.validateCellTransaction = (transaction) => cellStore.validate(transaction);
      wrapped.previewCellTransaction = (transaction) => cellStore.preview(transaction);
      wrapped.applyCellTransaction = (transaction) => cellStore.apply(transaction);
      wrapped.undoCellTransaction = () => cellStore.undo();
      wrapped.redoCellTransaction = () => cellStore.redo();
      wrapped.importCellRegistry = (registry) => cellStore.importData(registry);
      wrapped.describeCapabilities = () => ({ ...(baseMap.describeCapabilities?.() || {}), spherical_world: true, dynamic_world_packages: true, world_styles: ['surface', 'white'], renderer: sphere.getDiagnostics().renderer });
      try { window.SILK_MAP = Object.freeze(wrapped); } catch (_) { /* keep immutable host API if assignment is blocked */ }

      const ownerSelect = document.getElementById('sphereOwnerSelect');
      if (ownerSelect) {
        ownerSelect.replaceChildren(...data.countries.map((country, index) => {
          const option = document.createElement('option'); option.value = String(index); option.textContent = country.name; return option;
        }));
      }
      const syncEditor = () => {
        sphere.setEditor({ ...editor, tool: activeRailTab === 'edit' ? editor.tool : 'inspect' });
        document.querySelectorAll('[data-sphere-tool]').forEach((button) => button.classList.toggle('is-active', button.dataset.sphereTool === editor.tool));
        const terrainField = document.getElementById('sphereTerrainField'); if (terrainField) terrainField.hidden = editor.tool !== 'terrain';
        const ownerField = document.getElementById('sphereOwnerField'); if (ownerField) ownerField.hidden = editor.tool !== 'owner';
        const status = document.getElementById('sphereToolStatus');
        if (status) status.textContent = ({ inspect: 'セルを選択すると設定を確認できます。', terrain: '球面セルをクリックすると選択した地形へ変更します。', owner: '球面セルをクリックすると選択した国家へ割り当てます。', erase: '球面セルをクリックすると国家所属を解除します。' })[editor.tool];
      };
      document.querySelectorAll('[data-sphere-tool]').forEach((button) => button.addEventListener('click', () => { editor.tool = button.dataset.sphereTool; syncEditor(); }));
      document.getElementById('sphereTerrainSelect')?.addEventListener('change', (event) => { editor.terrain = event.target.value; syncEditor(); });
      ownerSelect?.addEventListener('change', (event) => { editor.owner = Number(event.target.value); syncEditor(); });
      document.getElementById('sphereBrushSelect')?.addEventListener('change', (event) => { editor.brush = Number(event.target.value); syncEditor(); });
      document.getElementById('sphereUndo')?.addEventListener('click', () => cellStore.undo());
      document.getElementById('sphereRedo')?.addEventListener('click', () => cellStore.redo());
      syncEditor();

      window.SILK_SELECTION = Object.freeze({ select: (id, source) => bus.select(id, source), clear: (source) => bus.clear(source), getState: bus.getState, subscribe: bus.subscribe });
      window.SILK_WORLD_SPHERE = Object.freeze({
        mount: () => sphere,
        setStyle: (value) => sphere.setStyle(value),
        setLayers: (value) => { const result = sphere.setLayers(value); syncLayerControls(); return result; },
        setVisible: (value) => sphere.setVisible(value),
        selectSubject: (id) => bus.select(id, 'external'),
        setAutoRotate: (value) => sphere.setAutoRotate(value),
        reset: (options) => sphere.reset(options),
        zoomBy: (factor) => sphere.zoomBy(factor),
        selectCell: (index) => sphere.selectCell(index),
        activateSelectedCell: () => sphere.activateSelectedCell(),
        refresh: refreshFromRegistry,
        loadWorldPackage: (pkg) => applyProject(pkg),
        getCellRegistry: () => cellStore.exportData(),
        validateTransaction: (transaction) => cellStore.validate(transaction),
        previewTransaction: (transaction) => cellStore.preview(transaction),
        applyTransaction: (transaction) => cellStore.apply(transaction),
        undo: () => cellStore.undo(),
        redo: () => cellStore.redo(),
        importCellRegistry: (registry) => cellStore.importData(registry),
        getDiagnostics: () => ({ ...sphere.getDiagnostics(), available: worldAvailable, source: worldSource }),
        getState: () => ({ ...sphere.getState(), available: worldAvailable, source: worldSource })
      });
      if (pendingPackage) applyProject(pendingPackage);
      syncStyle(); syncVisibility();
      document.dispatchEvent(new CustomEvent('silk:world-sphere-ready', { detail: sphere.getDiagnostics() }));
    };
    wait();
  }

  return { createSelectionBus, spherePointFromFeature, isGeographicPackage, validateSphericalData, deriveSphereData, boot };
});

// === SILK SECRET LOOM ========================================================
(() => {
  'use strict';
  if (typeof document === 'undefined') return;

  const TRIGGER_COUNT = 10;
  const TRIGGER_WINDOW_MS = 5000;
  const PHASES = ['SPIN', 'DEEPEN', 'WEAVE', 'CHALLENGE', 'INTEGRATE', 'REVIEW'];
  const PHASE_DENSITY = [.06, .16, .34, .58, .78, 1];
  const PHASE_COPY = [
    '候補として登録された主題を表示',
    '深掘り対象に選ばれた主題を追加表示',
    '主題間に登録された関係を表示',
    '監査対象になった接続まで表示',
    '統合済みの主題と接続を表示',
    '世界パッケージ内の全主題と関係を表示'
  ];

  let presses = [];
  let root = null;
  let canvas = null;
  let context = null;
  let animationFrame = 0;
  let packageData = { subjects: [], relations: [], collections: [] };
  let subjectsById = new Map();
  let relationsById = new Map();
  let points = new Map();
  let hits = [];

  const state = {
    phase: 5,
    yaw: -.48,
    pitch: .13,
    zoom: 1,
    selectedId: null,
    drag: null,
    interacted: false,
    lastFrame: 0
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  function readPackage() {
    try {
      if (window.SILK_PROJECT?.getPackage) return window.SILK_PROJECT.getPackage();
      const source = document.getElementById('silk-world-package');
      if (source) return JSON.parse(source.textContent);
    } catch (_) {}
    return { subjects: [], relations: [], collections: [] };
  }

  function hashVector(text) {
    let hash = 2166136261;
    for (const character of String(text)) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    const angle = ((hash >>> 0) % 100000) / 100000 * Math.PI * 2;
    const z = (((hash >>> 8) >>> 0) % 10000) / 5000 - 1;
    const radius = Math.sqrt(Math.max(0, 1 - z * z));
    return [Math.cos(angle) * radius, Math.sin(angle) * radius, z];
  }

  function rebuildData() {
    packageData = readPackage();
    packageData.subjects = Array.isArray(packageData.subjects) ? packageData.subjects : [];
    packageData.relations = Array.isArray(packageData.relations) ? packageData.relations : [];
    packageData.collections = Array.isArray(packageData.collections) ? packageData.collections : [];
    subjectsById = new Map(packageData.subjects.map(subject => [subject.id, subject]));
    relationsById = new Map(packageData.subjects.map(subject => [subject.id, []]));
    for (const relation of packageData.relations) {
      if (!relationsById.has(relation.source)) relationsById.set(relation.source, []);
      if (!relationsById.has(relation.target)) relationsById.set(relation.target, []);
      relationsById.get(relation.source).push(relation);
      relationsById.get(relation.target).push(relation);
    }
    points = new Map(packageData.subjects.map(subject => [subject.id, hashVector(subject.id)]));
    if (!subjectsById.has(state.selectedId)) {
      state.selectedId = [...packageData.subjects].sort((a, b) =>
        Number(b.display?.importance || 0) - Number(a.display?.importance || 0)
      )[0]?.id || null;
    }
  }

  function createView() {
    if (root) return root;
    root = document.createElement('section');
    root.id = 'silkSecretLoom';
    root.className = 'silk-secret-loom';
    root.hidden = true;
    root.setAttribute('aria-label', 'LOOM world formation view');
    root.innerHTML =
      "<aside class='secret-loom-rail'>" +
        "<p class='secret-loom-kicker'>RELATION VIEW / SPHERICAL GRAPH</p>" +
        "<h1>LOOM</h1>" +
        "<p class='secret-loom-copy'>世界設定の主題と関係を球面グラフで表示します。フェーズを選ぶと、その段階で有効な接続量を確認できます。</p>" +
        "<div class='secret-loom-phases' id='secretLoomPhases'></div>" +
        "<div class='secret-loom-counts'>" +
          "<span>SUBJECTS <b id='secretLoomSubjectCount'>0</b></span>" +
          "<span>RELATIONS <b id='secretLoomRelationCount'>0</b></span>" +
        "</div>" +
      "</aside>" +
      "<section class='secret-loom-stage'>" +
        "<canvas id='secretLoomCanvas' aria-label='設定の糸で編まれた世界球体'></canvas>" +
        "<header class='secret-loom-heading'>" +
          "<span>ITERATIVE WORLD FORMATION</span>" +
          "<h2>WORLD RELATION SPHERE</h2>" +
          "<p>ドラッグで回転、ホイールで拡大。点を選ぶと設定と接続を確認できます。</p>" +
        "</header>" +
        "<div class='secret-loom-camera'>" +
          "<button type='button' data-secret-loom-zoom='-1' aria-label='縮小'>−</button>" +
          "<button type='button' data-secret-loom-zoom='1' aria-label='拡大'>＋</button>" +
          "<button type='button' data-secret-loom-fit>FIT</button>" +
        "</div>" +
        "<div class='secret-loom-phase-readout'>" +
          "<span>CURRENT PHASE</span><b id='secretLoomPhaseName'>REVIEW</b>" +
        "</div>" +
      "</section>" +
      "<aside class='secret-loom-inspector' id='secretLoomInspector'></aside>";
    (document.querySelector('.silk-app') || document.body).appendChild(root);
    canvas = root.querySelector('#secretLoomCanvas');
    context = canvas.getContext('2d');
    bindView();
    new ResizeObserver(() => draw()).observe(canvas);
    return root;
  }

  function renderPhases() {
    if (!root) return;
    root.querySelector('#secretLoomPhases').innerHTML = PHASES.map((phase, index) =>
      "<button type='button' class='secret-loom-phase " +
      (index < state.phase ? 'is-done ' : '') +
      (index === state.phase ? 'is-active' : '') +
      "' data-secret-loom-phase='" + index + "'>" +
        "<i>" + (index < state.phase ? '✓' : index + 1) + "</i>" +
        "<span><b>" + phase + "</b><small>" + escapeHtml(PHASE_COPY[index]) + "</small></span>" +
      "</button>"
    ).join('');
    root.querySelector('#secretLoomPhaseName').textContent = PHASES[state.phase];
    root.querySelectorAll('[data-secret-loom-phase]').forEach(button => {
      button.addEventListener('click', () => {
        state.phase = Number(button.dataset.secretLoomPhase);
        renderPhases();
        draw();
      });
    });
  }

  function renderInspector() {
    if (!root) return;
    const host = root.querySelector('#secretLoomInspector');
    const subject = subjectsById.get(state.selectedId);
    if (!subject) {
      host.innerHTML = "<div class='secret-loom-empty'>点を選ぶと、ここに設定の概要と接続が表示されます。</div>";
      return;
    }
    const relations = relationsById.get(subject.id) || [];
    const related = relations.slice(0, 16).map(relation => {
      const targetId = relation.source === subject.id ? relation.target : relation.source;
      const target = subjectsById.get(targetId);
      if (!target) return '';
      return "<button type='button' data-secret-loom-subject='" + escapeHtml(target.id) + "'>" +
        "<span>" + escapeHtml(target.name) + "</span>" +
        "<small>" + escapeHtml(relation.kind || 'related') + "</small>" +
      "</button>";
    }).join('');
    host.innerHTML =
      "<p class='secret-loom-kicker'>SUBJECT DETAILS / RELATIONS</p>" +
      "<div class='secret-loom-status'>" + escapeHtml(subject.status || 'pending') + "</div>" +
      "<h1>" + escapeHtml(subject.name) + "</h1>" +
      "<code>" + escapeHtml(subject.id) + "</code>" +
      "<p class='secret-loom-summary'>" + escapeHtml(subject.summary || '概要はまだ記録されていない。') + "</p>" +
      "<section><h2>接続</h2><div class='secret-loom-related'>" +
        (related || '<p>表示できる接続はない。</p>') +
      "</div></section>";
    host.querySelectorAll('[data-secret-loom-subject]').forEach(button => {
      button.addEventListener('click', () => {
        state.selectedId = button.dataset.secretLoomSubject;
        renderInspector();
        draw();
      });
    });
  }

  function rotate(point) {
    const cy = Math.cos(state.yaw);
    const sy = Math.sin(state.yaw);
    const cp = Math.cos(state.pitch);
    const sp = Math.sin(state.pitch);
    const x = point[0] * cy + point[2] * sy;
    const z = -point[0] * sy + point[2] * cy;
    return [x, point[1] * cp - z * sp, point[1] * sp + z * cp];
  }

  function viewport() {
    const rect = canvas.getBoundingClientRect();
    return {
      rect,
      cx: rect.width / 2,
      cy: rect.height / 2 + 8,
      radius: Math.min(rect.width, rect.height) * .39 * state.zoom
    };
  }

  function project(point) {
    const view = viewport();
    const rotated = rotate(point);
    return {
      x: view.cx + rotated[0] * view.radius,
      y: view.cy - rotated[1] * view.radius,
      z: rotated[2]
    };
  }

  function resizeCanvas() {
    if (!canvas || !context) return null;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return rect;
  }

  function drawSphereGrid() {
    const view = viewport();
    const gradient = context.createRadialGradient(
      view.cx - view.radius * .32,
      view.cy - view.radius * .35,
      view.radius * .06,
      view.cx,
      view.cy,
      view.radius
    );
    gradient.addColorStop(0, '#fffef8');
    gradient.addColorStop(.68, '#f2efe4');
    gradient.addColorStop(1, '#d9d5c8');
    context.beginPath();
    context.arc(view.cx, view.cy, view.radius, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();
    context.save();
    context.beginPath();
    context.arc(view.cx, view.cy, view.radius, 0, Math.PI * 2);
    context.clip();

    const curves = [];
    for (let latitude = -60; latitude <= 60; latitude += 20) {
      const line = [];
      const phi = latitude * Math.PI / 180;
      for (let longitude = -180; longitude <= 180; longitude += 4) {
        const theta = longitude * Math.PI / 180;
        line.push([Math.cos(phi) * Math.cos(theta), Math.sin(phi), Math.cos(phi) * Math.sin(theta)]);
      }
      curves.push(line);
    }
    for (let longitude = -160; longitude < 180; longitude += 20) {
      const line = [];
      const theta = longitude * Math.PI / 180;
      for (let latitude = -88; latitude <= 88; latitude += 3) {
        const phi = latitude * Math.PI / 180;
        line.push([Math.cos(phi) * Math.cos(theta), Math.sin(phi), Math.cos(phi) * Math.sin(theta)]);
      }
      curves.push(line);
    }

    context.strokeStyle = 'rgba(23,25,20,.075)';
    context.lineWidth = .7;
    for (const curve of curves) {
      let drawing = false;
      context.beginPath();
      for (const point of curve) {
        const projected = project(point);
        if (projected.z < 0) {
          drawing = false;
          continue;
        }
        if (!drawing) {
          context.moveTo(projected.x, projected.y);
          drawing = true;
        } else {
          context.lineTo(projected.x, projected.y);
        }
      }
      context.stroke();
    }
    context.restore();
    context.beginPath();
    context.arc(view.cx, view.cy, view.radius, 0, Math.PI * 2);
    context.strokeStyle = 'rgba(23,25,20,.52)';
    context.lineWidth = 1.2;
    context.stroke();
  }

  function statusColor(subject) {
    if (subject.status === 'discarded') return '#d85b3d';
    if (subject.status === 'approved') return '#171914';
    return '#789800';
  }

  function drawThreads() {
    hits = [];
    const visibleRelations = Math.floor(packageData.relations.length * PHASE_DENSITY[state.phase]);
    const view = viewport();
    context.save();
    context.beginPath();
    context.arc(view.cx, view.cy, view.radius, 0, Math.PI * 2);
    context.clip();

    for (const relation of packageData.relations.slice(0, visibleRelations)) {
      const sourcePoint = points.get(relation.source);
      const targetPoint = points.get(relation.target);
      if (!sourcePoint || !targetPoint) continue;
      const source = project(sourcePoint);
      const target = project(targetPoint);
      if (source.z < 0 || target.z < 0) continue;
      const selected = relation.source === state.selectedId || relation.target === state.selectedId;
      context.beginPath();
      context.moveTo(source.x, source.y);
      context.lineTo(target.x, target.y);
      context.strokeStyle = selected ? 'rgba(111,142,0,.76)' : 'rgba(54,61,48,.19)';
      context.lineWidth = selected ? 1.65 : .72;
      context.stroke();
    }

    const sorted = [...packageData.subjects].sort((a, b) =>
      Number(a.display?.importance || 0) - Number(b.display?.importance || 0)
    );
    for (const subject of sorted) {
      const point = points.get(subject.id);
      if (!point) continue;
      const projected = project(point);
      if (projected.z < 0) continue;
      const importance = Number(subject.display?.importance || 0);
      const selected = subject.id === state.selectedId;
      const radius = selected ? 6.2 : importance >= 85 ? 3.7 : 1.85;
      if (selected) {
        context.beginPath();
        context.arc(projected.x, projected.y, radius + 5, 0, Math.PI * 2);
        context.strokeStyle = '#b8e318';
        context.lineWidth = 2;
        context.stroke();
      }
      context.beginPath();
      context.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
      context.fillStyle = selected ? '#171914' : statusColor(subject);
      context.fill();
      if (importance >= 88 && state.zoom > .92) {
        context.font = '600 10px "Noto Serif JP", serif';
        context.fillStyle = '#171914';
        context.textAlign = 'left';
        context.textBaseline = 'bottom';
        context.fillText(subject.name, projected.x + 8, projected.y - 5);
      }
      hits.push({ id: subject.id, x: projected.x, y: projected.y, radius: Math.max(8, radius + 4) });
    }
    context.restore();
  }

  function draw() {
    if (!root || root.hidden || !context) return;
    const rect = resizeCanvas();
    if (!rect) return;
    context.clearRect(0, 0, rect.width, rect.height);
    context.fillStyle = '#f3f0e5';
    context.fillRect(0, 0, rect.width, rect.height);
    context.strokeStyle = 'rgba(23,25,20,.035)';
    context.lineWidth = 1;
    for (let x = 0; x < rect.width; x += 48) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, rect.height);
      context.stroke();
    }
    for (let y = 0; y < rect.height; y += 48) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(rect.width, y);
      context.stroke();
    }
    drawSphereGrid();
    drawThreads();
  }

  function selectAt(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = [...hits].reverse().find(item => Math.hypot(item.x - x, item.y - y) <= item.radius);
    if (!hit) return;
    state.selectedId = hit.id;
    renderInspector();
    draw();
  }

  function bindView() {
    canvas.addEventListener('pointerdown', event => {
      state.interacted = true;
      state.drag = { x: event.clientX, y: event.clientY, yaw: state.yaw, pitch: state.pitch, moved: false };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {
      if (!state.drag) return;
      const dx = event.clientX - state.drag.x;
      const dy = event.clientY - state.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) state.drag.moved = true;
      state.yaw = state.drag.yaw + dx * .006;
      state.pitch = Math.max(-1.25, Math.min(1.25, state.drag.pitch + dy * .006));
      draw();
    });
    canvas.addEventListener('pointerup', event => {
      if (state.drag && !state.drag.moved) selectAt(event);
      state.drag = null;
    });
    canvas.addEventListener('pointercancel', () => {
      state.drag = null;
    });
    canvas.addEventListener('wheel', event => {
      event.preventDefault();
      state.interacted = true;
      state.zoom = Math.max(.62, Math.min(2.35, state.zoom * Math.exp(-event.deltaY * .001)));
      draw();
    }, { passive: false });
    root.querySelectorAll('[data-secret-loom-zoom]').forEach(button => {
      button.addEventListener('click', () => {
        state.interacted = true;
        const direction = Number(button.dataset.secretLoomZoom);
        state.zoom = Math.max(.62, Math.min(2.35, state.zoom * (direction > 0 ? 1.18 : 1 / 1.18)));
        draw();
      });
    });
    root.querySelector('[data-secret-loom-fit]').addEventListener('click', () => {
      state.yaw = -.48;
      state.pitch = .13;
      state.zoom = 1;
      state.interacted = true;
      draw();
    });
  }

  function animate(time) {
    if (!root || root.hidden) {
      animationFrame = 0;
      return;
    }
    const delta = state.lastFrame ? Math.min(50, time - state.lastFrame) : 0;
    state.lastFrame = time;
    if (!state.interacted) {
      state.yaw += delta * .000045;
      draw();
    }
    animationFrame = requestAnimationFrame(animate);
  }

  function open() {
    createView();
    rebuildData();
    const loomState = window.SILK_LOOM?.getState?.();
    if (Number.isInteger(loomState?.phase)) state.phase = Math.max(0, Math.min(5, loomState.phase));
    root.querySelector('#secretLoomSubjectCount').textContent = packageData.subjects.length.toLocaleString();
    root.querySelector('#secretLoomRelationCount').textContent = packageData.relations.length.toLocaleString();
    renderPhases();
    renderInspector();
    document.querySelectorAll('.mode-button.is-active').forEach(button => button.classList.remove('is-active'));
    document.body.classList.add('silk-secret-loom-active');
    root.hidden = false;
    state.lastFrame = 0;
    draw();
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(animate);
    return true;
  }

  function close() {
    if (!root || root.hidden) return false;
    root.hidden = true;
    document.body.classList.remove('silk-secret-loom-active');
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    state.drag = null;
    state.lastFrame = 0;
    presses = [];
    return true;
  }

  document.addEventListener('pointerdown', event => {
    const modeButton = event.target.closest?.('.mode-button[data-mode="world"], .mode-button[data-mode="connections"]');
    if (modeButton && root && !root.hidden) {
      close();
      return;
    }
    const brand = event.target.closest?.('[data-action="overview"]');
    if (!brand || event.button !== 0) return;
    const now = performance.now();
    presses = presses.filter(time => now - time <= TRIGGER_WINDOW_MS);
    presses.push(now);
    if (presses.length >= TRIGGER_COUNT) {
      presses = [];
      open();
    }
  }, true);

  window.SILK_SECRET_LOOM = Object.freeze({
    open,
    close,
    getState: () => ({
      open: Boolean(root && !root.hidden),
      phase: state.phase,
      selectedId: state.selectedId,
      triggerCount: presses.length,
      triggerWindowMs: TRIGGER_WINDOW_MS
    })
  });
})();
// === /SILK SECRET LOOM =======================================================

