import { dev, expectPoll, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// TODO: failed to run this case after updating playwright
// https://github.com/web-infra-dev/rsbuild/pull/4331
test.skip('should lazy compile dynamic imported modules', async ({ page }) => {
  // TODO fix this case on Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  const rsbuild = await dev({
    cwd: __dirname,
  });

  await expectPoll(() =>
    rsbuild.logs.some((log) => log.includes('built in ')),
  ).toBeTruthy();
  expect(
    rsbuild.logs.some((log) => log.includes('building src/foo.js')),
  ).toBeFalsy();

  await gotoPage(page, rsbuild, 'index');
  await expectPoll(() =>
    rsbuild.logs.some((log) => log.includes('building src/foo.js')),
  ).toBeTruthy();

  await rsbuild.close();
});
