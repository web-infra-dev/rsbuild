import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should compile basic svelte component properly in build',
  async ({ page, buildPreview }) => {
    await buildPreview();
    const title = page.locator('#title');
    await expect(title).toHaveText('Hello world!');
  },
);

rspackTest(
  'should compile basic svelte component properly in dev',
  async ({ page, dev }) => {
    await dev();
    const title = page.locator('#title');
    await expect(title).toHaveText('Hello world!');
  },
);
