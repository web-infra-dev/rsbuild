import { build, dev, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

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
  await rsbuild.close();
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
  await rsbuild.close();
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

test('should inject assetPrefix to env var and template correctly', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      html: {
        template: './src/template.html',
      },
      output: {
        assetPrefix: 'http://example.com',
        inlineScripts: true,
      },
    },
  });

  await gotoPage(page, rsbuild);
  await expect(page.locator('#prefix1')).toHaveText('http://example.com');
  await expect(page.locator('#prefix2')).toHaveText('http://example.com');
  await rsbuild.close();
});
