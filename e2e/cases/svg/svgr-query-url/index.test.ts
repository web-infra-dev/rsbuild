import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should import svg with SVGR plugin and query URL correctly', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  // test svg asset
  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.includes('static/svg/mobile')`,
    ),
  ).resolves.toBeTruthy();

  // test svg asset in css
  await expect(
    page.evaluate(
      `getComputedStyle(document.getElementById('test-css')).backgroundImage.includes('static/svg/mobile')`,
    ),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});
