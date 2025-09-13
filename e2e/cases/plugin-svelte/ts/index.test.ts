import { expect, gotoPage, rspackTest } from '@e2e/helper';

rspackTest(
  'should build svelte component with typescript',
  async ({ page, buildPreview }) => {
    const rsbuild = await buildPreview();

    await gotoPage(page, rsbuild);

    const title = page.locator('#title');
    await expect(title).toHaveText('Hello world!');

    const count = page.locator('#count');
    await expect(count).toHaveText('Count: 2');
  },
);
