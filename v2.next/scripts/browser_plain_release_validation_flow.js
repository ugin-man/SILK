async page => {
  const ensure = (condition, message) => { if (!condition) throw new Error(message); };
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('http://127.0.0.1:8765/v2.next/SILK-V2.html?plain-release=1');
  await page.waitForFunction(() => window.SILK_WORLD_SPHERE?.getState?.().renderer);
  await page.waitForTimeout(250);

  const initial = await page.evaluate(() => {
    const pkg = JSON.parse(document.getElementById('silk-world-package').textContent);
    const cells = window.SILK_MAP.getCellRegistry();
    const sphere = window.SILK_WORLD_SPHERE.getState();
    return {
      title: document.querySelector('.sphere-world-chrome h1')?.textContent?.trim(),
      worldId: pkg.world_id,
      subjects: pkg.subjects.length,
      relations: pkg.relations.length,
      cells: cells.terrain.length,
      oceanCells: cells.terrain.filter(value => value === 'ocean').length,
      claimedCells: cells.owners.filter(value => value >= 0).length,
      countries: cells.countries.length,
      settlements: cells.settlements.length,
      style: sphere.style,
      renderer: sphere.renderer
    };
  });
  ensure(initial.title === '新しい世界', 'plain WORLD title is incorrect');
  ensure(initial.worldId === 'starter_world', 'plain world id is incorrect');
  ensure(initial.subjects === 1 && initial.relations === 0, 'plain semantic package is not empty');
  ensure(initial.cells === 12962 && initial.oceanCells === 12962 && initial.claimedCells === 0, 'plain cell registry is not empty');
  ensure(initial.countries === 0 && initial.settlements === 0, 'plain geography contains project data');
  await page.screenshot({ path: 'output/playwright/silk-v2-plain-world.png', fullPage: true, animations: 'disabled' });

  await page.getByRole('button', { name: /WHITE/ }).click();
  await page.waitForTimeout(120);
  ensure((await page.evaluate(() => window.SILK_WORLD_SPHERE.getState().style)) === 'white', 'WHITE did not activate');
  await page.getByRole('button', { name: /SURFACE/ }).click();
  ensure((await page.evaluate(() => window.SILK_WORLD_SPHERE.getState().style)) === 'surface', 'SURFACE did not reactivate');

  const sphereBox = await page.locator('#silkSphereOverlay').boundingBox();
  ensure(Boolean(sphereBox), 'WORLD sphere overlay is missing');
  const cellX = sphereBox.x + sphereBox.width * .5;
  const cellY = sphereBox.y + sphereBox.height * .5;
  await page.locator('[data-sphere-rail-tab="edit"]').click();
  await page.locator('[data-sphere-tool="terrain"]').click();
  await page.locator('#sphereTerrainSelect').selectOption('desert');
  await page.mouse.click(cellX, cellY);
  await page.waitForTimeout(180);
  const edit = await page.evaluate(() => {
    const state = window.SILK_WORLD_SPHERE.getState();
    const index = state.editor.selectedCell;
    return { index, terrain: window.SILK_MAP.getCellRegistry().terrain[index], autoRotate: state.autoRotate };
  });
  ensure(Number.isInteger(edit.index) && edit.terrain === 'desert', 'terrain edit did not apply to an empty cell');
  ensure(edit.autoRotate === false, 'first interaction did not stop automatic rotation');
  await page.getByRole('button', { name: 'UNDO', exact: true }).click();
  ensure((await page.evaluate(index => window.SILK_MAP.getCellRegistry().terrain[index], edit.index)) === 'ocean', 'terrain undo did not restore ocean');
  await page.locator('[data-sphere-rail-tab="display"]').click();

  await page.locator('.mode-button[data-mode="connections"]').click();
  await page.waitForFunction(() => !document.getElementById('connectionsView').hidden);
  const atlas = await page.evaluate(() => ({
    worldHidden: document.getElementById('worldView').hidden,
    atlasHidden: document.getElementById('connectionsView').hidden,
    nodes: window.SILK_ATLAS.getRenderSnapshot().nodes.length,
    selected: window.SILK_ATLAS.getState()?.selectedSubjectId || null
  }));
  ensure(atlas.worldHidden && !atlas.atlasHidden, 'ATLAS did not replace WORLD');
  ensure(atlas.nodes >= 1, 'ATLAS does not show the starter subject');

  await page.locator('[data-atlas-rail-surface="reader"]').click();
  await page.waitForFunction(() => !document.getElementById('atlasReader').hidden);
  const reader = await page.evaluate(() => ({
    visible: !document.getElementById('atlasReader').hidden,
    title: document.querySelector('.atlas-reader-index-header strong')?.textContent?.trim(),
    article: document.querySelector('.atlas-reader-article-pane')?.textContent || ''
  }));
  ensure(reader.visible && reader.title === '新しい世界', 'Reader did not open the starter world');
  ensure(reader.article.includes('はじめに') || reader.article.includes('世界パッケージ'), 'Reader article is missing starter guidance');

  await page.locator('.mode-button[data-mode="world"]').click();
  await page.waitForFunction(() => !document.getElementById('worldView').hidden);
  const logo = page.locator('[data-action="overview"]');
  for (let index = 0; index < 10; index += 1) await logo.click({ delay: 10 });
  await page.waitForFunction(() => document.body.classList.contains('silk-secret-loom-active'));
  const loom = await page.evaluate(() => ({
    visible: !document.getElementById('silkSecretLoom')?.hidden,
    heading: document.querySelector('#silkSecretLoom h2')?.textContent?.trim(),
    copy: document.querySelector('#silkSecretLoom .secret-loom-copy')?.textContent?.trim()
  }));
  ensure(loom.visible && loom.heading === 'WORLD RELATION SPHERE', 'secret LOOM did not open');
  ensure(loom.copy.includes('主題と関係を球面グラフで表示'), 'secret LOOM does not explain its function');
  await page.screenshot({ path: 'output/playwright/silk-v2-plain-loom.png', fullPage: true, animations: 'disabled' });

  await page.locator('.mode-button[data-mode="world"]').click();
  await page.waitForFunction(() => !document.body.classList.contains('silk-secret-loom-active'));
  ensure(await page.locator('#worldView').isVisible(), 'WORLD button did not exit secret LOOM');

  for (let index = 0; index < 10; index += 1) await logo.click({ delay: 10 });
  await page.waitForFunction(() => document.body.classList.contains('silk-secret-loom-active'));
  await page.locator('.mode-button[data-mode="connections"]').click();
  await page.waitForFunction(() => !document.body.classList.contains('silk-secret-loom-active'));
  ensure(await page.locator('#connectionsView').isVisible(), 'ATLAS button did not exit secret LOOM');

  await page.screenshot({ path: 'output/playwright/silk-v2-plain-release.png', fullPage: true, animations: 'disabled' });
  ensure(consoleErrors.length === 0, `console errors: ${consoleErrors.join(' | ')}`);
  ensure(pageErrors.length === 0, `page errors: ${pageErrors.join(' | ')}`);
  return { initial, edit, atlas, reader, loom, consoleErrors, pageErrors };
}
