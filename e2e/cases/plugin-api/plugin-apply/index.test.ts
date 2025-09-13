import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should apply plugin as expected when running dev server',
  async ({ page, dev }) => {
    await dev();

    const body = page.locator('body');
    await expect(body).toHaveText('serve-plugin');
    await expect(body).not.toHaveText('build-plugin');
  },
);

rspackTest(
  'should apply plugin as expected when running build',
  async ({ page, buildPreview }) => {
    await buildPreview();

    const body = page.locator('body');
    await expect(body).toHaveText('build-plugin');
    await expect(body).not.toHaveText('serve-plugin');
  },
);
