import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('use SVGR and default export React component', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  await expect(
    page.evaluate(`document.getElementById('test-svg').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});
