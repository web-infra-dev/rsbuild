import { build, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should run top level await correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  expect(await page.evaluate('window.foo')).toEqual('hello');

  await rsbuild.close();
});
