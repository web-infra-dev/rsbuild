import { expect } from '@playwright/test';
import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should run babel with @rsbuild/babel-preset correctly',
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
