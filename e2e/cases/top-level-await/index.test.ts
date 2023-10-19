import * as path from 'path';
import { expect } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';
import { webpackOnlyTest } from '../../scripts/helper';

webpackOnlyTest('should run top level await correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.ts'),
    },
    runServer: true,
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  expect(await page.evaluate('window.foo')).toEqual('hello');

  rsbuild.close();
});
