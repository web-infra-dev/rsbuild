import { dev, expectPoll, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// TODO: fixme
test.skip('should replace port placeholder with actual port', async ({
  page,
}) => {
  // TODO fix this case on Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  const rsbuild = await dev({
    cwd: __dirname,
  });

  await gotoPage(page, rsbuild, 'page1');
  await expect(page.locator('#test')).toHaveText('Page 1');
  await expectPoll(() =>
    rsbuild.logs.some((log) => log.includes('building src/page1/index.js')),
  ).toBeTruthy();
  expect(
    rsbuild.logs.some((log) => log.includes('building src/page2/index.js')),
  ).toBeFalsy();

  await gotoPage(page, rsbuild, 'page2');
  await expect(page.locator('#test')).toHaveText('Page 2');
  await expectPoll(() =>
    rsbuild.logs.some((log) => log.includes('building src/page2/index.js')),
  ).toBeTruthy();

  await rsbuild.close();
});
