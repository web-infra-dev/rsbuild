import { getRandomPort, gotoPage, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { logger } from '@rsbuild/core';
import {
  count404Response,
  createBlockMiddleware,
  createRsbuildWithMiddleware,
} from './helper';

test('should work when blocking initial chunk index.js', async ({ page }) => {
  logger.level = 'verbose';
  const { logs, restore } = proxyConsole();
  const blockedMiddleware = createBlockMiddleware({
    blockNum: 3,
    urlPrefix: '/static/js/index.js',
  });
  const rsbuild = await createRsbuildWithMiddleware(blockedMiddleware, {});

  await gotoPage(page, rsbuild);
  const compTestElement = page.locator('#comp-test');
  await expect(compTestElement).toHaveText('Hello CompTest');
  const blockedResponseCount = count404Response(logs, '/static/js/index.js');
  expect(blockedResponseCount).toBe(3);
  await rsbuild.close();
  restore();
  logger.level = 'log';
});

test('should work with minified runtime code when blocking initial chunk index.js', async ({
  page,
}) => {
  logger.level = 'verbose';
  const { logs, restore } = proxyConsole();
  const blockedMiddleware = createBlockMiddleware({
    blockNum: 3,
    urlPrefix: '/static/js/index.js',
  });
  const rsbuild = await createRsbuildWithMiddleware(blockedMiddleware, {
    minify: true,
  });

  await gotoPage(page, rsbuild);
  const compTestElement = page.locator('#comp-test');
  await expect(compTestElement).toHaveText('Hello CompTest');
  const blockedResponseCount = count404Response(logs, '/static/js/index.js');
  expect(blockedResponseCount).toBe(3);
  await rsbuild.close();
  restore();
  logger.level = 'log';
});

test('react ErrorBoundary should catch error when all retries failed', async ({
  page,
}) => {
  logger.level = 'verbose';
  const { logs, restore } = proxyConsole();
  const blockedMiddleware = createBlockMiddleware({
    blockNum: 100,
    urlPrefix: '/static/js/async/src_AsyncCompTest_tsx.js',
  });
  const rsbuild = await createRsbuildWithMiddleware(blockedMiddleware, {});

  await gotoPage(page, rsbuild);
  const compTestElement = page.locator('#async-comp-test-error');
  await expect(compTestElement).toHaveText(
    /ChunkLoadError: Loading chunk src_AsyncCompTest_tsx from "static\/js\/async\/src_AsyncCompTest_tsx\.js" failed after 3 retries: "Loading chunk src_AsyncCompTest_tsx failed.*/,
  );
  const blockedResponseCount = count404Response(
    logs,
    '/static/js/async/src_AsyncCompTest_tsx.js',
  );
  // 1 first request failed
  // 2 3 4 retried again three times and failed all of them
  expect(blockedResponseCount).toBe(4);
  await rsbuild.close();
  restore();
  logger.level = 'log';
});

test('should work when the first, second cdn are all failed and the third is success', async ({
  page,
}) => {
  // this is a real world case for assets-retry
  const port = await getRandomPort();
  const rsbuild = await createRsbuildWithMiddleware(
    [],
    {
      minify: true,
      domain: [
        'http://a.com/foo-path',
        'http://b.com',
        `http://localhost:${port}`,
      ],
      addQuery: true,
      onRetry(context) {
        console.info('onRetry', context);
      },
      onSuccess(context) {
        console.info('onSuccess', context);
      },
      onFail(context) {
        console.info('onFail', context);
      },
    },
    undefined,
    port,
    'http://a.com/foo-path',
  );

  await gotoPage(page, rsbuild);
  const compTestElement = page.locator('#async-comp-test');
  await expect(compTestElement).toHaveText('Hello AsyncCompTest');
  await expect(compTestElement).toHaveCSS('background-color', 'rgb(0, 0, 139)');
});
