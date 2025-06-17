import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should build svelte component with typescript',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    await gotoPage(page, rsbuild);

    const title = page.locator('#title');
    await expect(title).toHaveText('Hello world!');

    const count = page.locator('#count');
    await expect(count).toHaveText('Count: 2');

    await rsbuild.close();
  },
);
