import path from 'path';
import { expect } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';

webpackOnlyTest('decorator latest', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
    runServer: true,
    rsbuildConfig: {
      output: {
        enableLatestDecorators: true,
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));
  expect(await page.evaluate('window.aaa')).toBe('hello world');

  // swc...
  if (rsbuild.providerType !== 'rspack') {
    expect(await page.evaluate('window.bbb')).toContain(
      "Cannot assign to read only property 'message' of object",
    );

    expect(await page.evaluate('window.ccc')).toContain(
      "Cannot assign to read only property 'message' of object",
    );
  }

  await rsbuild.close();
});
