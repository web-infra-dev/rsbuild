import { expect, test } from '@playwright/test';
import { build, gotoPage } from '@e2e/helper';

test('Use SVGR and exclude some files', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  await expect(
    page.evaluate(`document.getElementById('foo').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  await expect(
    page.evaluate(
      `document.getElementById('bar').src.startsWith('data:image/svg')`,
    ),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});
