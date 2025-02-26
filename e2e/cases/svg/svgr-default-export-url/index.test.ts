import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should import default from SVG with SVGR correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  // test svgr（namedExport）
  await expect(
    page.evaluate(`document.getElementById('component').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  // test SVG asset
  await expect(
    page.evaluate(`document.getElementById('large-img').src`),
  ).resolves.toMatch(/http:/);

  // test SVG asset
  await expect(
    page.evaluate(
      `document.getElementById('small-img').src.startsWith('data:image/svg')`,
    ),
  ).resolves.toBeTruthy();

  // test SVG asset in CSS
  await expect(
    page.evaluate(
      `getComputedStyle(document.getElementById('test-css-small')).backgroundImage.includes('url("data:image/svg')`,
    ),
  ).resolves.toBeTruthy();
  await expect(
    page.evaluate(
      `getComputedStyle(document.getElementById('test-css-large')).backgroundImage.includes('http:')`,
    ),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});
