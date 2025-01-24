import { gotoPage, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { logger } from '@rsbuild/core';
import {
  count404Response,
  createBlockMiddleware,
  createRsbuildWithMiddleware,
} from './helper';

test('should work when blocking async chunk', async ({ page }) => {
  logger.level = 'verbose';
  const { logs, restore } = proxyConsole();
  const blockedMiddleware = createBlockMiddleware({
    blockNum: 3,
    urlPrefix: '/static/js/async/src_AsyncCompTest_tsx.js',
  });
  const rsbuild = await createRsbuildWithMiddleware(blockedMiddleware, {});

  await gotoPage(page, rsbuild);
  const compTestElement = page.locator('#async-comp-test');
  await expect(compTestElement).toHaveText('Hello AsyncCompTest');
  const blockedResponseCount = count404Response(
    logs,
    '/static/js/async/src_AsyncCompTest_tsx.js',
  );
  expect(blockedResponseCount).toBe(3);
  await rsbuild.close();
  restore();
  logger.level = 'log';
});

test('should work when blocking async css chunk`', async ({ page }) => {
  logger.level = 'verbose';
  const { logs, restore } = proxyConsole();
  const blockedMiddleware = createBlockMiddleware({
    blockNum: 3,
    urlPrefix: '/static/css/async/src_AsyncCompTest_tsx.css',
  });
  const rsbuild = await createRsbuildWithMiddleware(blockedMiddleware, {});

  await gotoPage(page, rsbuild);
  const compTestElement = page.locator('#async-comp-test');
  await expect(compTestElement).toHaveText('Hello AsyncCompTest');
  await expect(compTestElement).toHaveCSS('background-color', 'rgb(0, 0, 139)');
  const blockedResponseCount = count404Response(
    logs,
    '/static/css/async/src_AsyncCompTest_tsx.css',
  );
  expect(blockedResponseCount).toBe(3);
  await rsbuild.close();
  restore();
  logger.level = 'log';
});

test('should work with minified runtime code when blocking async chunk', async ({
  page,
}) => {
  logger.level = 'verbose';
  const { logs, restore } = proxyConsole();
  const blockedMiddleware = createBlockMiddleware({
    blockNum: 3,
    urlPrefix: '/static/js/async/src_AsyncCompTest_tsx.js',
  });
  const rsbuild = await createRsbuildWithMiddleware(blockedMiddleware, {
    minify: true,
  });

  await gotoPage(page, rsbuild);
  const compTestElement = page.locator('#async-comp-test');
  await expect(compTestElement).toHaveText('Hello AsyncCompTest');
  const blockedResponseCount = count404Response(
    logs,
    '/static/js/async/src_AsyncCompTest_tsx.js',
  );
  expect(blockedResponseCount).toBe(3);
  await rsbuild.close();
  restore();
  logger.level = 'log';
});
