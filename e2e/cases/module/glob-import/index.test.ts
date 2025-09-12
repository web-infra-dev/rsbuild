import { build, expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should glob import components in dev build correctly',
  async ({ page, dev }) => {
    await dev();

    await expect(page.locator('#header')).toHaveText('Header');
    await expect(page.locator('#footer')).toHaveText('Footer');
  },
);

rspackOnlyTest(
  'should glob import components in build correctly',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    await expect(page.locator('#header')).toHaveText('Header');
    await expect(page.locator('#footer')).toHaveText('Footer');

    await rsbuild.close();
  },
);
