import { expect, test } from '@playwright/test';
import { build, dev, gotoPage } from '@e2e/helper';

test('multi compiler build', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      output: {
        targets: ['web', 'node'],
      },
    },
  });

  await gotoPage(page, rsbuild);

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});

test('multi compiler dev', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        targets: ['web', 'node'],
        distPath: {
          root: 'dist-dev',
        },
      },
    },
  });

  await gotoPage(page, rsbuild);

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();
});
