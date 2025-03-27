import {
  dev,
  expectPoll,
  gotoPage,
  proxyConsole,
  rspackOnlyTest,
} from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should render pages correctly when using lazy compilation',
  async ({ page }) => {
    const { logs, restore } = proxyConsole();
    const rsbuild = await dev({
      cwd: __dirname,
    });

    await gotoPage(page, rsbuild, 'page1');
    await expect(page.locator('#test')).toHaveText('Page 1');
    await expectPoll(() =>
      logs.some((log) => log.includes('building src/page1/index.js')),
    ).toBeTruthy();
    expect(
      logs.some((log) => log.includes('building src/page2/index.js')),
    ).toBeFalsy();

    await gotoPage(page, rsbuild, 'page2');
    await expect(page.locator('#test')).toHaveText('Page 2');
    await expectPoll(() =>
      logs.some((log) => log.includes('building src/page2/index.js')),
    ).toBeTruthy();

    await rsbuild.close();
    restore();
  },
);
