import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should render basic React component in development correctly',
  async ({ page, dev }) => {
    await dev();

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0');
    await button.click();
    await expect(button).toHaveText('count: 1');
  },
);

rspackOnlyTest(
  'should render basic React component in production correctly',
  async ({ page, build }) => {
    const rsbuild = await build();

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0');
    await button.click();
    await expect(button).toHaveText('count: 1');

    const index = await rsbuild.getIndexBundle();
    expect(index).toContain('memo_cache_sentinel');
  },
);
