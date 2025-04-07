import {
  dev,
  expectPoll,
  gotoPage,
  proxyConsole,
  rspackOnlyTest,
} from '@e2e/helper';
import { expect, test } from '@playwright/test';

rspackOnlyTest(
  'should lazy compile dynamic imported modules',
  async ({ page }) => {
    // TODO fix this case on Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    const { logs, restore } = proxyConsole();
    const rsbuild = await dev({
      cwd: __dirname,
    });

    await expectPoll(() =>
      logs.some((log) => log.includes('built in ')),
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
