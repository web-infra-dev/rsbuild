import { dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

test('should work with the default writeToDisk configuration', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd,
    page,
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-write-to-disk-default',
        },
      },
    },
  });

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});

test('should work when writeToDisk is set to false', async ({ page }) => {
  const rsbuild = await dev({
    cwd,
    page,
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

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});

test('should work when writeToDisk is set to true', async ({ page }) => {
  const rsbuild = await dev({
    cwd,
    page,
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

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});
