import path from 'path';
import { expect, test } from '@playwright/test';
import { build, dev, getHrefByEntryName } from '@scripts/shared';

test('multi compiler build', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    target: ['web', 'node'],
    runServer: true,
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});

test('multi compiler dev', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    target: ['web', 'node'],
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-dev',
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();
});
