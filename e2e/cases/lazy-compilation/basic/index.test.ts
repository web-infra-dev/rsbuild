import { dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

rspackOnlyTest(
  'should render pages correctly when using lazy compilation',
  async ({ page }) => {
    if (process.platform === 'win32') {
      test.skip();
    }

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
    await expect(page.locator('#test')).toHaveText('Page 1');
    await rsbuild.expectLog('building src/page1/index.js');
    await rsbuild.expectBuildEnd();
    rsbuild.expectNoLog('building src/page2/index.js');
    rsbuild.clearLogs();

    // build page2
    await gotoPage(page, rsbuild, 'page2');
    await expect(page.locator('#test')).toHaveText('Page 2');
    await rsbuild.expectLog('building src/page2/index.js');
    await rsbuild.expectBuildEnd();
    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should allow to configure `tools.rspack.experiments.lazyCompilation`',
  async ({ page }) => {
    if (process.platform === 'win32') {
      test.skip();
    }

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
    await expect(page.locator('#test')).toHaveText('Page 1');
    await rsbuild.expectLog('building src/page1/index.js');
    await rsbuild.expectBuildEnd();
    rsbuild.expectNoLog('building src/page2/index.js');
    rsbuild.clearLogs();

    // build page2
    await gotoPage(page, rsbuild, 'page2');
    await expect(page.locator('#test')).toHaveText('Page 2');
    await rsbuild.expectLog('building src/page2/index.js');
    await rsbuild.expectBuildEnd();
    await rsbuild.close();
  },
);
