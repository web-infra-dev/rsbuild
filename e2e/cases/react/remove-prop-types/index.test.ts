import { join } from 'path';
import { expect } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

// TODO: needs builtin:swc-loader
webpackOnlyTest('should remove prop-types by default', async ({ page }) => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.js'),
    },
    runServer: true,
    plugins: [pluginReact()],
  });
  await page.goto(getHrefByEntryName('main', rsbuild.port));

  expect(await page.evaluate('window.testAppPropTypes')).toBeUndefined();
  rsbuild.close();
});
