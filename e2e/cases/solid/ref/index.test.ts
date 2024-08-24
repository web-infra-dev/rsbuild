import { dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

// https://github.com/web-infra-dev/rsbuild/issues/1963
rspackOnlyTest('Solid ref should work', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  const test = page.locator('#test');
  await expect(test).toHaveText('abc');

  await rsbuild.close();
});
