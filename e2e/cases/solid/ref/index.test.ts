import { expect } from '@playwright/test';
import { dev, gotoPage, rspackOnlyTest } from '@e2e/helper';

// https://github.com/web-infra-dev/rsbuild/issues/1963
rspackOnlyTest('Solid ref should work', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
  });

  await gotoPage(page, rsbuild);

  const test = page.locator('#test');
  await expect(test).toHaveText('abc');

  rsbuild.close();
});
