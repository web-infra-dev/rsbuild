import { expect, test } from '@playwright/test';
import { dev, build, gotoPage } from '@e2e/helper';

test('should allow dev.assetPrefix to be `auto`', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {
      dev: {
        assetPrefix: 'auto',
      },
    },
  });

  await gotoPage(page, rsbuild);
  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');
  await rsbuild.server.close();
});

test('should allow dev.assetPrefix to be true', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {
      dev: {
        assetPrefix: true,
      },
    },
  });

  await gotoPage(page, rsbuild);
  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');
  await rsbuild.server.close();
});

test('should allow output.assetPrefix to be `auto`', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      output: {
        assetPrefix: 'auto',
      },
    },
  });

  await gotoPage(page, rsbuild);
  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');
  await rsbuild.close();
});
