import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should import default from SVG with react query correctly', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  await expect(
    page.evaluate(`document.getElementById('component').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  // test SVG asset
  await expect(
    page.evaluate(`document.getElementById('url').src`),
  ).resolves.toMatch(/http:/);

  await rsbuild.close();
});
