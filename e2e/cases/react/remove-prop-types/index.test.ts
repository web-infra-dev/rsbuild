import { test, expect } from '@playwright/test';
import { build, gotoPage } from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

// TODO: needs builtin:swc-loader
test.skip('should remove prop-types by default', async ({ page }) => {
  const rsbuild = await build({
    cwd: fixtures,
    runServer: true,
    plugins: [pluginReact()],
  });
  await gotoPage(page, rsbuild);

  expect(await page.evaluate('window.testAppPropTypes')).toBeUndefined();
  await rsbuild.close();
});
