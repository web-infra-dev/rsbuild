import { join } from 'path';
import { expect, test } from '@playwright/test';
import { dev, gotoPage } from '@e2e/helper';

const fixtures = __dirname;

test('writeToDisk default', async ({ page }) => {
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-write-to-disk-default',
        },
      },
    },
  });

  await gotoPage(page, rsbuild);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();
});

test('writeToDisk false', async ({ page }) => {
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-write-to-disk-false',
        },
      },
      dev: {
        writeToDisk: false,
      },
    },
  });

  await gotoPage(page, rsbuild);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();
});

test('writeToDisk true', async ({ page }) => {
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-write-to-disk',
        },
      },
      dev: {
        writeToDisk: true,
      },
    },
  });

  await gotoPage(page, rsbuild);

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();
});
