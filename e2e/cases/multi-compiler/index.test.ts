import path from 'path';
import { expect, test } from '@playwright/test';
import { build, dev, getHrefByEntryName } from '@scripts/shared';

test('multi compiler build', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: { main: path.resolve(__dirname, 'src/index.js') },
    target: ['web', 'node'],
    runServer: true,
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  rsbuild.close();
});

test('multi compiler dev', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    entry: { main: path.resolve(__dirname, 'src/index.js') },
    target: ['web', 'node'],
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();
});
