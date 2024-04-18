import { expect } from '@playwright/test';
import { build, gotoPage, rspackOnlyTest as test } from '@e2e/helper';

test('should build Vue sfc style correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  const button = page.locator('#button');
  await expect(button).toHaveCSS('color', 'rgb(255, 0, 0)');

  const body = page.locator('body');
  await expect(body).toHaveCSS('background-color', 'rgb(0, 0, 255)');

  await expect(body).toHaveCSS('padding', '16px');

  await rsbuild.close();
});
