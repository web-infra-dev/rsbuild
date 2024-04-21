import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should build Vue sfc with lang="jsx" correctly',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
    });

    await gotoPage(page, rsbuild);

    const button = page.locator('#button');
    await expect(button).toHaveText('0');

    const foo = page.locator('#foo');
    await expect(foo).toHaveText('Foo');

    await rsbuild.close();
  },
);
