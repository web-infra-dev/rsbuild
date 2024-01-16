import { expect, test } from '@playwright/test';
import { build, gotoPage } from '@scripts/shared';

test('should import default from SVG with SVGR correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  // test svgr（namedExport）
  await expect(
    page.evaluate(`document.getElementById('component').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  // test svg asset
  await expect(
    page.evaluate(`document.getElementById('large-img').src`),
  ).resolves.toMatch(/http:/);

  // test svg asset
  await expect(
    page.evaluate(
      `document.getElementById('small-img').src.startsWith('data:image/svg')`,
    ),
  ).resolves.toBeTruthy();

  // test svg asset in css
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
