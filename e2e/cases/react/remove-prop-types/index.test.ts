import { expect } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

// TODO: needs builtin:swc-loader
webpackOnlyTest('should remove prop-types by default', async ({ page }) => {
  const rsbuild = await build({
    cwd: fixtures,
    runServer: true,
    plugins: [pluginReact()],
  });
  await page.goto(getHrefByEntryName('index', rsbuild.port));

  expect(await page.evaluate('window.testAppPropTypes')).toBeUndefined();
  await rsbuild.close();
});
