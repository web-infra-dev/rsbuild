import { expect, rspackOnlyTest } from '@e2e/helper';

// https://github.com/web-infra-dev/rsbuild/issues/1963
rspackOnlyTest('Solid ref should work', async ({ page, dev }) => {
  await dev();

  const test = page.locator('#test');
  await expect(test).toHaveText('abc');
});
