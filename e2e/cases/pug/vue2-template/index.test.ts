import { test, expect } from '@playwright/test';
import { build, gotoPage } from '@e2e/helper';

test('should allow to use .pug template file', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  const testPug = page.locator('#test-pug');
  await expect(testPug).toHaveText('Pug source code!');

  const button1 = page.locator('#button1');
  await expect(button1).toHaveText('A: 0');

  await rsbuild.close();
});
