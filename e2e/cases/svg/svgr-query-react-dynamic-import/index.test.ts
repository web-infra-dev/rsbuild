import { expect, test } from '@playwright/test';
import { build, gotoPage } from '@e2e/helper';

// https://github.com/web-infra-dev/rsbuild/issues/1766
test('should import default from SVG with react query and dynamic import correctly', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  await expect(
    page.evaluate(`document.getElementById('component').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  // test svg asset
  await expect(
    page.evaluate(`document.getElementById('url').src`),
  ).resolves.toMatch(/http:/);

  await rsbuild.close();
});
