import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should build basic Vue sfc correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  const button1 = page.locator('#button1');
  const button2 = page.locator('#button2');
  const list1 = page.locator('.list1');

  await expect(button1).toHaveText('A: 0');
  await expect(button2).toHaveText('B: 0');
  await expect(list1).toHaveCount(3);

  await rsbuild.close();
});
