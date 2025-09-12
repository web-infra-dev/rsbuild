import { build, expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should render basic Preact component in development correctly',
  async ({ page, dev }) => {
    await dev();

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0');
    await button.click();
    await expect(button).toHaveText('count: 1');
  },
);

rspackOnlyTest(
  'should render basic Preact component in production correctly',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0');
    await button.click();
    await expect(button).toHaveText('count: 1');

    await rsbuild.close();
  },
);
