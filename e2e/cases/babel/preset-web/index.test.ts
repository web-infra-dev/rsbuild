import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should run babel with @rsbuild/babel-preset/web correctly',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
    });

    await gotoPage(page, rsbuild);
    expect(await page.evaluate('window.a')).toBe(10);
    await rsbuild.close();
  },
);
