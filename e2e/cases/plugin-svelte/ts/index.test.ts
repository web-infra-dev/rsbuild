import { expect, gotoPage, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should build svelte component with typescript',
  async ({ page, build }) => {
    const rsbuild = await build();

    await gotoPage(page, rsbuild);

    const title = page.locator('#title');
    await expect(title).toHaveText('Hello world!');

    const count = page.locator('#count');
    await expect(count).toHaveText('Count: 2');
  },
);
