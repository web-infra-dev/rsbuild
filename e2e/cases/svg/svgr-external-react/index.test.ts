import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// It's an old bug when use svgr in CSS and external react.
test('use SVGR and externals react', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  // test svgr（namedExport）
  await expect(
    page.evaluate(`document.getElementById('test-svg').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  // test SVG asset
  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.startsWith('data:image/svg')`,
    ),
  ).resolves.toBeTruthy();

  // test SVG asset in CSS
  await expect(
    page.evaluate(
      `getComputedStyle(document.getElementById('test-css')).backgroundImage.includes('url("data:image/svg')`,
    ),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});
