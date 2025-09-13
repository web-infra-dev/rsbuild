import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should apply plugin as expected when running dev server',
  async ({ page, dev }) => {
    await dev();

    const body = page.locator('body');
    await expect(body).toHaveText('serve-plugin');
    await expect(body).not.toHaveText('build-plugin');
  },
);

rspackOnlyTest(
  'should apply plugin as expected when running build',
  async ({ page, build }) => {
    await build();

    const body = page.locator('body');
    await expect(body).toHaveText('build-plugin');
    await expect(body).not.toHaveText('serve-plugin');
  },
);
