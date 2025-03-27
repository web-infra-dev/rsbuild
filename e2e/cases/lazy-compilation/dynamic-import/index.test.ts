import {
  dev,
  expectPoll,
  gotoPage,
  proxyConsole,
  rspackOnlyTest,
} from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should lazy compile dynamic imported modules',
  async ({ page }) => {
    const { logs, restore } = proxyConsole();
    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });

    await expectPoll(() =>
      logs.some((log) => log.includes('building src/index.js')),
    ).toBeTruthy();
    expect(logs.some((log) => log.includes('building src/foo.js'))).toBeFalsy();

    await gotoPage(page, rsbuild, 'index');
    await expectPoll(() =>
      logs.some((log) => log.includes('building src/foo.js')),
    ).toBeTruthy();

    await rsbuild.close();
    restore();
  },
);
