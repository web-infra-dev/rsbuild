import { join } from 'path';
import { expect, test } from '@playwright/test';
import { dev, getHrefByEntryName } from '@scripts/shared';

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

  await page.goto(getHrefByEntryName('index', rsbuild.port));

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

  await page.goto(getHrefByEntryName('index', rsbuild.port));

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

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();
});
