import { join } from 'path';
import { expect, test } from '@playwright/test';
import { dev, getHrefByEntryName } from '@scripts/shared';

const fixtures = __dirname;

test('writeToDisk default', async ({ page }) => {
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
    rsbuildConfig: {},
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();
});

test('writeToDisk false', async ({ page }) => {
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
    rsbuildConfig: {
      dev: {
        devMiddleware: {
          writeToDisk: false,
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();
});

test('writeToDisk true', async ({ page }) => {
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
    rsbuildConfig: {
      dev: {
        devMiddleware: {
          writeToDisk: true,
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();
});
