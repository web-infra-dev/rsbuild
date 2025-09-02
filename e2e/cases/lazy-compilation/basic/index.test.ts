import { dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should render pages correctly when using lazy compilation',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      rsbuildConfig: {
        dev: {
          lazyCompilation: true,
        },
      },
    });

    // the first build
    await rsbuild.expectBuildEnd();
    rsbuild.clearLogs();

    // build page1
    await gotoPage(page, rsbuild, 'page1');
    await rsbuild.expectBuildEnd();
    await expect(page.locator('#test')).toHaveText('Page 1');
    rsbuild.clearLogs();

    // build page2
    await gotoPage(page, rsbuild, 'page2');
    await rsbuild.expectBuildEnd();
    await expect(page.locator('#test')).toHaveText('Page 2');
    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should allow to configure `tools.rspack.experiments.lazyCompilation`',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      rsbuildConfig: {
        tools: {
          rspack: {
            lazyCompilation: true,
          },
        },
      },
    });

    // the first build
    await rsbuild.expectBuildEnd();
    rsbuild.clearLogs();

    // build page1
    await gotoPage(page, rsbuild, 'page1');
    await rsbuild.expectBuildEnd();
    await expect(page.locator('#test')).toHaveText('Page 1');
    rsbuild.clearLogs();

    // build page2
    await gotoPage(page, rsbuild, 'page2');
    await rsbuild.expectBuildEnd();
    await expect(page.locator('#test')).toHaveText('Page 2');
    await rsbuild.close();
  },
);
