import path from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

test('decorator legacy(default)', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {},
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));
  expect(await page.evaluate('window.aaa')).toBe('hello!');
  expect(await page.evaluate('window.bbb')).toBe('world');

  await rsbuild.close();
});

test('decorator latest', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      output: {
        enableLatestDecorators: true,
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));
  expect(await page.evaluate('window.aaa')).toBe('hello!');
  expect(await page.evaluate('window.bbb')).toBe('world');

  await rsbuild.close();
});
