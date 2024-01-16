import { test, expect } from '@playwright/test';
import { build, gotoPage } from '@scripts/shared';

test('should run top level await correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  expect(await page.evaluate('window.foo')).toEqual('hello');

  await rsbuild.close();
});
