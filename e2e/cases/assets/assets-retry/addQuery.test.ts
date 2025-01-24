import { gotoPage, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { logger } from '@rsbuild/core';
import {
  count404ResponseByUrl,
  createBlockMiddleware,
  createRsbuildWithMiddleware,
} from './helper';

test('should work with addQuery boolean option', async ({ page }) => {
  logger.level = 'verbose';
  const { logs, restore } = proxyConsole();
  const initialChunkBlockedMiddleware = createBlockMiddleware({
    blockNum: 3,
    urlPrefix: '/static/js/index.js',
  });

  const asyncChunkBlockedMiddleware = createBlockMiddleware({
    blockNum: 3,
    urlPrefix: '/static/js/async/src_AsyncCompTest_tsx.js',
  });
  const rsbuild = await createRsbuildWithMiddleware(
    [initialChunkBlockedMiddleware, asyncChunkBlockedMiddleware],
    {
      minify: true,
      addQuery: true,
    },
  );

  await gotoPage(page, rsbuild);
  const compTestElement = page.locator('#comp-test');
  await expect(compTestElement).toHaveText('Hello CompTest');

  const asyncCompTestElement = page.locator('#async-comp-test');
  await expect(asyncCompTestElement).toHaveText('Hello AsyncCompTest');

  const blockedResponseCount = count404ResponseByUrl(
    logs,
    '/static/js/index.js',
  );
  expect(blockedResponseCount).toMatchObject({
    '/static/js/index.js': 1,
    '/static/js/index.js?retry=1': 1,
    '/static/js/index.js?retry=2': 1,
  });
  const blockedAsyncChunkResponseCount = count404ResponseByUrl(
    logs,
    '/static/js/async/src_AsyncCompTest_tsx.js',
  );
  expect(blockedAsyncChunkResponseCount).toMatchObject({
    '/static/js/async/src_AsyncCompTest_tsx.js': 1,
    '/static/js/async/src_AsyncCompTest_tsx.js?retry=1': 1,
    '/static/js/async/src_AsyncCompTest_tsx.js?retry=2': 1,
  });

  await rsbuild.close();
  restore();
  logger.level = 'log';
});

test('should work with addQuery boolean option when retrying async css chunk', async ({
  page,
}) => {
  logger.level = 'verbose';
  const { logs, restore } = proxyConsole();

  const asyncChunkBlockedMiddleware = createBlockMiddleware({
    blockNum: 3,
    urlPrefix: '/static/css/async/src_AsyncCompTest_tsx.css',
  });
  const rsbuild = await createRsbuildWithMiddleware(
    asyncChunkBlockedMiddleware,
    {
      minify: true,
      addQuery: true,
    },
  );

  await gotoPage(page, rsbuild);
  const asyncCompTestElement = page.locator('#async-comp-test');
  await expect(asyncCompTestElement).toHaveText('Hello AsyncCompTest');
  await expect(asyncCompTestElement).toHaveCSS(
    'background-color',
    'rgb(0, 0, 139)',
  );

  const blockedAsyncChunkResponseCount = count404ResponseByUrl(
    logs,
    '/static/css/async/src_AsyncCompTest_tsx.css',
  );
  expect(blockedAsyncChunkResponseCount).toMatchObject({
    '/static/css/async/src_AsyncCompTest_tsx.css': 1,
    '/static/css/async/src_AsyncCompTest_tsx.css?retry=1': 1,
    '/static/css/async/src_AsyncCompTest_tsx.css?retry=2': 1,
  });

  await rsbuild.close();
  restore();
  logger.level = 'log';
});

test('should work with addQuery function type option', async ({ page }) => {
  logger.level = 'verbose';
  const { logs, restore } = proxyConsole();
  const initialChunkBlockedMiddleware = createBlockMiddleware({
    blockNum: 3,
    urlPrefix: '/static/js/index.js',
  });

  const asyncChunkBlockedMiddleware = createBlockMiddleware({
    blockNum: 3,
    urlPrefix: '/static/js/async/src_AsyncCompTest_tsx.js',
  });
  const rsbuild = await createRsbuildWithMiddleware(
    [initialChunkBlockedMiddleware, asyncChunkBlockedMiddleware],
    {
      minify: true,
      addQuery: ({ times, originalQuery }) => {
        const query =
          times === 3 ? `retryCount=${times}&isLast=1` : `retryCount=${times}`;
        return originalQuery ? `${originalQuery}&${query}` : `?${query}`;
      },
    },
  );

  await gotoPage(page, rsbuild);
  const compTestElement = page.locator('#comp-test');
  await expect(compTestElement).toHaveText('Hello CompTest');

  const asyncCompTestElement = page.locator('#async-comp-test');
  await expect(asyncCompTestElement).toHaveText('Hello AsyncCompTest');

  const blockedResponseCount = count404ResponseByUrl(
    logs,
    '/static/js/index.js',
  );
  expect(blockedResponseCount).toMatchObject({
    '/static/js/index.js': 1,
    '/static/js/index.js?retryCount=1': 1,
    '/static/js/index.js?retryCount=2': 1,
  });
  const blockedAsyncChunkResponseCount = count404ResponseByUrl(
    logs,
    '/static/js/async/src_AsyncCompTest_tsx.js',
  );
  expect(blockedAsyncChunkResponseCount).toMatchObject({
    '/static/js/async/src_AsyncCompTest_tsx.js': 1,
    '/static/js/async/src_AsyncCompTest_tsx.js?retryCount=1': 1,
    '/static/js/async/src_AsyncCompTest_tsx.js?retryCount=2': 1,
  });

  await rsbuild.close();
  restore();
  logger.level = 'log';
});

test('should preserve users query when set addQuery option', async ({
  page,
}) => {
  logger.level = 'verbose';
  const { logs, restore } = proxyConsole();

  const blockedMiddleware1 = createBlockMiddleware({
    blockNum: 3,
    urlPrefix: '/test-query?a=1&b=1',
  });
  const blockedMiddleware2 = createBlockMiddleware({
    blockNum: 3,
    urlPrefix: '/test-query-hash?a=1&b=1',
  });

  const rsbuild = await createRsbuildWithMiddleware(
    [blockedMiddleware1, blockedMiddleware2],
    {
      addQuery: true,
      minify: true,
    },
    './src/testQueryEntry.js',
  );

  await gotoPage(page, rsbuild);
  const blockedResponseCount1 = count404ResponseByUrl(
    logs,
    '/test-query?a=1&b=1',
  );
  expect(blockedResponseCount1).toMatchObject({
    '/test-query?a=1&b=1': 1,
    '/test-query?a=1&b=1&retry=1': 1,
    '/test-query?a=1&b=1&retry=2': 1,
  });

  const blockedResponseCount2 = count404ResponseByUrl(
    logs,
    '/test-query-hash?a=1&b=1',
  );
  expect(blockedResponseCount2).toMatchObject({
    '/test-query-hash?a=1&b=1': 1,
    '/test-query-hash?a=1&b=1&retry=1': 1,
    '/test-query-hash?a=1&b=1&retry=2': 1,
  });

  await rsbuild.close();
  restore();
  logger.level = 'log';
});
