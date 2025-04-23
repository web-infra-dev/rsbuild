import { dev, expectPoll, gotoPage, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// TODO: failed to run this case after updating playwright
// https://github.com/web-infra-dev/rsbuild/pull/4331
test.skip('should replace port placeholder with actual port', async ({
  page,
}) => {
  // TODO fix this case on Windows
  if (process.platform === 'win32') {
    test.skip();
  }

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
});
