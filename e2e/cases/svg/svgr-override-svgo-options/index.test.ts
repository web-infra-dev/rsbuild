import { build, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('use SVGR and override svgo plugin options', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  await expect(
    page.evaluate(
      `document.getElementById('with-id_svg__svg-path').tagName === 'path'`,
    ),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});
