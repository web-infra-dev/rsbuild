import { build, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to use .pug template file', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  const testPug = page.locator('#test-pug');
  await expect(testPug).toHaveText('Pug source code!');

  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});
