import { build, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should import default from SVG with react query correctly', async ({
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

  await rsbuild.close();
});
