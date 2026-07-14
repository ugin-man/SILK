async page => {
  const ensure = (condition, message) => { if (!condition) throw new Error(message); };
  const consoleErrors = [];
  const pageErrors = [];
  const externalRequests = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:8765/')) externalRequests.push(request.url()); });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:8765/v2.next/SILK-V2.html?completion-validation=1');
  await page.waitForFunction(() => window.SILK_WORLD_SPHERE?.getState?.().renderer && window.SILK_PACKAGE_GUARD && window.SILK_PROJECT?.getPackage?.());
  await page.waitForTimeout(200);
  const initial = await page.evaluate(() => ({ project: window.SILK_PROJECT.getState(), cells: window.SILK_MAP.getCellRegistry(), guard: window.SILK_PACKAGE_GUARD.version, a11y: window.SILK_A11Y?.audit?.() }));
  ensure(initial.project.world_id === 'starter_world', 'starter world did not load');
  ensure(initial.cells.countries.length === 0 && initial.cells.settlements.length === 0, 'starter geography is not empty');
  ensure(initial.a11y && initial.a11y.missingAffordance.length === 0 && initial.a11y.undersizedTargets.length === 0, 'desktop accessibility audit failed');

  const malformed = await page.evaluate(async () => {
    const before = window.SILK_PROJECT.getState();
    const pkg = window.SILK_PROJECT.getPackage();
    pkg.world_id = 'malformed_world'; pkg.meta.id = 'malformed_world'; pkg.world.id = 'malformed_world';
    pkg.subjects.push({ ...pkg.subjects[0] }); pkg.integration.subject_count = 2;
    let error = null;
    try { await window.SILK_PROJECT.loadPackage(pkg); } catch (reason) { error = String(reason?.message || reason); }
    return { before, after: window.SILK_PROJECT.getState(), error, status: document.getElementById('silkProjectStatus')?.textContent };
  });
  ensure(Boolean(malformed.error), 'malformed package was accepted');
  ensure(malformed.after.world_id === malformed.before.world_id, 'malformed import replaced the active world');
  ensure(/rejected|拒否|duplicate/i.test(`${malformed.error} ${malformed.status}`), 'rejection was not visible');

  const spatialImport = await page.evaluate(async () => {
    const pkg = window.SILK_PROJECT.getPackage();
    const worldId = 'spatial_fixture';
    pkg.world_id = worldId; pkg.meta.id = worldId; pkg.world.id = worldId; pkg.spatial_registry.world_id = worldId;
    pkg.meta.title = 'Spatial Fixture'; pkg.world.title = 'Spatial Fixture';
    pkg.collections.push({ id: 'polities', label: 'Polities', description: 'Spatial polities' });
    const makeSubject = (id,name,kind,importance) => ({ id, collection_id: 'polities', name, aliases: [], kind, status: 'approved', summary: name, body_markdown: `## ${name}`, display: { importance, visibility_tier: 1 } });
    pkg.subjects.push(makeSubject('polity.west','West','polity',90), makeSubject('polity.east','East','polity',85), makeSubject('city.capital','Capital','city',100));
    pkg.spatial_registry.features = [
      { id: 'feature.west', subject_id: 'polity.west', geometry: { type: 'Polygon', coordinates: [[[0.10,0.20],[0.48,0.20],[0.48,0.80],[0.10,0.80],[0.10,0.20]]] } },
      { id: 'feature.east', subject_id: 'polity.east', geometry: { type: 'Polygon', coordinates: [[[0.52,0.20],[0.90,0.20],[0.90,0.80],[0.52,0.80],[0.52,0.20]]] } },
      { id: 'feature.capital', subject_id: 'city.capital', geometry: { type: 'Point', coordinates: [0.30,0.50] }, properties: { importance: 100, role: 'capital' } }
    ];
    pkg.integration.subject_count = pkg.subjects.length; pkg.integration.relation_count = 0; pkg.integration.spatial_feature_count = 3;
    await window.SILK_PROJECT.loadPackage(pkg);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const cells = window.SILK_MAP.getCellRegistry();
    return { worldId: window.SILK_PROJECT.getState().world_id, countries: cells.countries.length, settlements: cells.settlements.length, claimed: cells.owners.filter(owner => owner >= 0).length, source: window.SILK_WORLD_SPHERE.getState().source };
  });
  ensure(spatialImport.worldId === 'spatial_fixture' && spatialImport.countries === 2 && spatialImport.settlements === 1 && spatialImport.claimed > 0, 'valid spatial package did not populate WORLD');
  ensure(spatialImport.source === 'spatial_registry', 'WORLD did not report Spatial Registry as its source');
  await page.screenshot({ path: 'output/playwright/silk-v2-complete-spatial-import.png', fullPage: true, animations: 'disabled' });

  const xss = await page.evaluate(async () => {
    const pkg = window.SILK_PROJECT.getPackage();
    pkg.world_id = 'safe_text_world'; pkg.meta.id = 'safe_text_world'; pkg.world.id = 'safe_text_world'; pkg.spatial_registry.world_id = 'safe_text_world';
    pkg.meta.title = '<img src=x onerror=window.__silkXss=1>';
    pkg.world.title = pkg.meta.title;
    pkg.subjects[0].name = pkg.meta.title;
    pkg.subjects[0].body_markdown = '## <img src=x onerror=window.__silkXss=1>';
    await window.SILK_PROJECT.loadPackage(pkg);
    window.__SILK_V210__.setMode('connections');
    window.SILK_READER.setSurface('reader');
    window.SILK_READER.openSubject(pkg.subjects[0].id);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { executed: window.__silkXss || 0, images: document.querySelectorAll('.atlas-reader img').length, text: document.querySelector('.atlas-reader-article')?.textContent || '' };
  });
  ensure(xss.executed === 0 && xss.images === 0, 'untrusted package markup executed');
  ensure(xss.text.includes('<img'), 'unsafe markup was not preserved as visible text');

  await page.reload();
  await page.waitForFunction(() => window.SILK_WORLD_SPHERE?.getState?.().renderer && window.SILK_PROJECT?.getPackage?.());
  await page.locator('[data-sphere-rail-tab="edit"]').click();
  await page.locator('[data-sphere-tool="terrain"]').click();
  await page.locator('#sphereTerrainSelect').selectOption('desert');
  const overlay = page.locator('#silkSphereOverlay');
  await overlay.focus();
  await overlay.press('ArrowRight');
  await overlay.press('Space');
  const keyboard = await page.evaluate(() => {
    const state = window.SILK_WORLD_SPHERE.getState();
    return { selected: state.editor.selectedCell, terrain: window.SILK_MAP.getCellRegistry().terrain[state.editor.selectedCell], dirty: window.SILK_PROJECT.getState().dirty };
  });
  ensure(Number.isInteger(keyboard.selected) && keyboard.terrain === 'desert', 'keyboard cell editing failed');
  ensure(keyboard.dirty === true, 'edited project was not marked dirty');
  const exported = await page.evaluate(() => {
    const pkg = window.SILK_PROJECT.exportPackage();
    return { valid: window.SILK_PACKAGE_GUARD.validateWorldPackage(pkg).ok, terrain: pkg.spherical_cells.terrain[window.SILK_WORLD_SPHERE.getState().editor.selectedCell], dirty: window.SILK_PROJECT.getState().dirty };
  });
  ensure(exported.valid && exported.terrain === 'desert' && exported.dirty === false, 'export did not preserve and validate cell edits');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(180);
  const mobileWorld = await page.evaluate(() => ({ app: getComputedStyle(document.getElementById('app')).display, guard: getComputedStyle(document.getElementById('viewportGuard')).display, width: document.documentElement.scrollWidth, worldButton: document.querySelector('[data-mode="world"]')?.getBoundingClientRect().width || 0 }));
  ensure(mobileWorld.app !== 'none' && mobileWorld.guard === 'none' && mobileWorld.worldButton > 0, 'mobile WORLD is unavailable');
  ensure(mobileWorld.width <= 392, `mobile WORLD overflows horizontally: ${mobileWorld.width}`);
  await page.screenshot({ path: 'output/playwright/silk-v2-complete-mobile-world.png', fullPage: true, animations: 'disabled' });
  await page.locator('[data-mode="connections"]').click();
  await page.locator('[data-atlas-rail-surface="reader"]').click();
  await page.waitForTimeout(180);
  const mobileReader = await page.evaluate(() => ({ visible: !document.getElementById('atlasReader').hidden, width: document.documentElement.scrollWidth, article: document.querySelector('.atlas-reader-article-pane')?.getBoundingClientRect().width || 0, tabs: document.querySelector('.atlas-rail-tabs')?.getBoundingClientRect().width || 0, a11y: window.SILK_A11Y?.audit?.() }));
  ensure(mobileReader.visible && mobileReader.article > 200 && mobileReader.tabs > 200, 'mobile Reader is not usable');
  ensure(mobileReader.width <= 392, `mobile Reader overflows horizontally: ${mobileReader.width}`);
  ensure(mobileReader.a11y && mobileReader.a11y.missingAffordance.length === 0 && mobileReader.a11y.undersizedTargets.length === 0, 'mobile accessibility audit failed');
  await page.screenshot({ path: 'output/playwright/silk-v2-complete-mobile-reader.png', fullPage: true, animations: 'disabled' });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('[data-mode="world"]').click();
  await page.screenshot({ path: 'output/playwright/silk-v2-complete-world.png', fullPage: true, animations: 'disabled' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:8765/v2.next/SILK-V2.html?completion-validation=reduced-motion');
  await page.waitForFunction(() => window.SILK_WORLD_SPHERE?.getState?.().renderer);
  const reducedMotion = await page.evaluate(() => ({ autoRotate: window.SILK_WORLD_SPHERE.getState().autoRotate, media: matchMedia('(prefers-reduced-motion: reduce)').matches }));
  ensure(reducedMotion.media && reducedMotion.autoRotate === false, 'reduced-motion preference was ignored');
  ensure(externalRequests.length === 0, `standalone build made external requests: ${externalRequests.join(' | ')}`);
  ensure(consoleErrors.length === 0, `console errors: ${consoleErrors.join(' | ')}`);
  ensure(pageErrors.length === 0, `page errors: ${pageErrors.join(' | ')}`);
  return { initial: { worldId: initial.project.world_id, guard: initial.guard, a11y: initial.a11y }, malformed, spatialImport, xss, keyboard, exported, mobileWorld, mobileReader, reducedMotion, externalRequests, consoleErrors, pageErrors };
}
