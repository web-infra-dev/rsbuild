import { dev, getRandomPort, gotoPage, proxyConsole } from '@e2e/helper';
import { type Page, expect, test } from '@playwright/test';
import { type RequestHandler, logger } from '@rsbuild/core';
import { pluginAssetsRetry } from '@rsbuild/plugin-assets-retry';
import type { PluginAssetsRetryOptions } from '@rsbuild/plugin-assets-retry';
import { pluginReact } from '@rsbuild/plugin-react';
import stripAnsi from 'strip-ansi';

// TODO: write a common testMiddleware instead of collect DEBUG logger

function count404Response(logs: string[], urlPrefix: string): number {
  let count = 0;
  for (const log of logs) {
    const rawLog = stripAnsi(log);
    // e.g: 18:09:23 404 GET /static/js/index.js 4.443 ms
    if (rawLog.includes('404 GET') && rawLog.includes(urlPrefix)) {
      count++;
    }
  }
  return count;
}

function count404ResponseByUrl(
  logs: string[],
  urlPrefix: string,
): Record<string, number> {
  const countCollector: Record<string, number> = {};
  // e.g: 18:09:23 404 GET /static/js/index.js 4.443 ms
  const reg = /404\sGET\s(.*)\s\d/;
  for (const log of logs) {
    const rawLog = stripAnsi(log);
    const url = reg.exec(rawLog)?.[1];
    if (!url) {
      continue;
    }
    if (!url.startsWith(urlPrefix)) {
      continue;
    }
    if (!countCollector[url]) {
      countCollector[url] = 0;
    }
    countCollector[url] += 1;
  }
  return countCollector;
}

type AssetsRetryHookContext = {
  url: string;
  times: number;
  domain: string;
  tagName: string;
};

function createBlockMiddleware({
  urlPrefix,
  blockNum,
}: {
  urlPrefix: string;
  blockNum: number;
}): RequestHandler {
  let counter = 0;
  return (req, res, next) => {
    if (req.url?.startsWith(urlPrefix)) {
      counter++;
      // if blockNum is 3, 1 2 3 would be blocked, 4 would be passed
      if (counter <= blockNum) {
        res.statusCode = 404;
      }
      res.setHeader('block-async', counter);
    }
    next();
  };
}

async function createRsbuildWithMiddleware(
  middleware: RequestHandler | RequestHandler[],
  options: PluginAssetsRetryOptions,
  entry?: string,
  port?: number,
) {
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [pluginReact(), pluginAssetsRetry(options)],
      dev: {
        hmr: false,
        liveReload: false,
        setupMiddlewares: [
          (middlewares, _server) => {
            const addMiddleWares = Array.isArray(middleware)
              ? middleware
              : [middleware];
            middlewares.unshift(...addMiddleWares);
          },
        ],
      },
      ...(port
        ? {
            server: {
              port,
            },
          }
        : {}),
      ...(entry
        ? {
            source: { entry: { index: entry } },
          }
        : {}),
      output: {
        sourceMap: {
          css: false,
          js: false,
        },
      },
    },
  });
  return rsbuild;
}

test('@rsbuild/plugin-assets-retry should work when blocking initial chunk index.js', async ({
  page,
}) => {
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

test('@rsbuild/plugin-assets-retry should work with minified runtime code when blocking initial chunk index.js', async ({
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

test('@rsbuild/plugin-assets-retry should work when blocking async chunk`', async ({
  page,
}) => {
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

test('@rsbuild/plugin-assets-retry should work when blocking async css chunk`', async ({
  page,
}) => {
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

test('@rsbuild/plugin-assets-retry should work with minified runtime code when blocking async chunk', async ({
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

test('@rsbuild/plugin-assets-retry should catch error by react ErrorBoundary when all retries failed', async ({
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
    /ChunkLoadError: Loading chunk src_AsyncCompTest_tsx from \/static\/js\/async\/src_AsyncCompTest_tsx\.js failed after 3 retries: "Loading chunk src_AsyncCompTest_tsx failed.*/,
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

function delay(ms = 300) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(1);
    }, ms);
  });
}

async function proxyPageConsole(page: Page, port: number) {
  const onRetryContextList: AssetsRetryHookContext[] = [];
  const onSuccessContextList: AssetsRetryHookContext[] = [];
  const onFailContextList: AssetsRetryHookContext[] = [];

  const origin = `http://localhost:${port}`;

  page.on('console', async (msg) => {
    if (msg.type() !== 'info') {
      return;
    }
    const typeValue = (await msg.args()[0].jsonValue()) as string;
    const contextValue = (await msg
      .args()[1]
      .jsonValue()) as AssetsRetryHookContext;

    if (
      typeValue === 'onRetry' ||
      typeValue === 'onSuccess' ||
      typeValue === 'onFail'
    ) {
      // For snapshot
      contextValue.url = contextValue.url?.replace(origin, '<ORIGIN>');
      contextValue.domain = contextValue.domain?.replace(origin, '<ORIGIN>');
    }

    if (typeValue === 'onRetry') {
      onRetryContextList.push(contextValue);
    } else if (typeValue === 'onSuccess') {
      onSuccessContextList.push(contextValue);
    } else if (typeValue === 'onFail') {
      onFailContextList.push(contextValue);
    }
  });
  return {
    onRetryContextList,
    onSuccessContextList,
    onFailContextList,
  };
}

test('@rsbuild/plugin-assets-retry onRetry and onSuccess options should work in successfully retrying initial chunk', async ({
  page,
}) => {
  const blockedMiddleware = createBlockMiddleware({
    blockNum: 3,
    urlPrefix: '/static/js/index.js',
  });

  const rsbuild = await createRsbuildWithMiddleware(blockedMiddleware, {
    minify: true,
    onRetry(context) {
      console.info('onRetry', context);
    },
    onSuccess(context) {
      console.info('onSuccess', context);
    },
    onFail(context) {
      console.info('onFail', context);
    },
  });

  const { onRetryContextList, onFailContextList, onSuccessContextList } =
    await proxyPageConsole(page, rsbuild.port);
  await gotoPage(page, rsbuild);
  const compTestElement = page.locator('#comp-test');
  await expect(compTestElement).toHaveText('Hello CompTest');
  await delay();

  expect({
    onRetryContextList,
    onFailContextList,
    onSuccessContextList,
  }).toMatchObject({
    onRetryContextList: [
      {
        times: 0,
        domain: '<ORIGIN>',
        url: '<ORIGIN>/static/js/index.js',
        tagName: 'script',
        isAsyncChunk: false,
      },
      {
        times: 1,
        domain: '<ORIGIN>',
        url: '<ORIGIN>/static/js/index.js',
        tagName: 'script',
        isAsyncChunk: false,
      },
      {
        times: 2,
        domain: '<ORIGIN>',
        url: '<ORIGIN>/static/js/index.js',
        tagName: 'script',
        isAsyncChunk: false,
      },
    ],
    onFailContextList: [],
    onSuccessContextList: [
      {
        times: 3,
        domain: '<ORIGIN>',
        url: '<ORIGIN>/static/js/index.js',
        tagName: 'script',
        isAsyncChunk: false,
      },
    ],
  });
  await rsbuild.close();
});

test('@rsbuild/plugin-assets-retry onRetry and onSuccess options should work in successfully retrying async chunk', async ({
  page,
}) => {
  const blockedMiddleware = createBlockMiddleware({
    blockNum: 3,
    urlPrefix: '/static/js/async/src_AsyncCompTest_tsx.js',
  });

  const rsbuild = await createRsbuildWithMiddleware(blockedMiddleware, {
    minify: true,
    onRetry(context) {
      console.info('onRetry', context);
    },
    onSuccess(context) {
      console.info('onSuccess', context);
    },
    onFail(context) {
      console.info('onFail', context);
    },
  });

  const { onRetryContextList, onFailContextList, onSuccessContextList } =
    await proxyPageConsole(page, rsbuild.port);

  await gotoPage(page, rsbuild);
  const compTestElement = page.locator('#async-comp-test');
  await expect(compTestElement).toHaveText('Hello AsyncCompTest');
  await delay();

  expect({
    onRetryContextList,
    onFailContextList,
    onSuccessContextList,
  }).toMatchObject({
    onRetryContextList: [
      {
        times: 0,
        domain: '<ORIGIN>',
        url: '<ORIGIN>/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
        isAsyncChunk: true,
      },
      {
        times: 1,
        domain: '<ORIGIN>',
        url: '<ORIGIN>/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
        isAsyncChunk: true,
      },
      {
        times: 2,
        domain: '<ORIGIN>',
        url: '<ORIGIN>/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
        isAsyncChunk: true,
      },
    ],
    onFailContextList: [],
    onSuccessContextList: [
      {
        times: 3,
        domain: '<ORIGIN>',
        url: '<ORIGIN>/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
        isAsyncChunk: true,
      },
    ],
  });
  await rsbuild.close();
});

test('@rsbuild/plugin-assets-retry onRetry and onFail options should work in failed retrying initial chunk', async ({
  page,
}) => {
  const blockedMiddleware = createBlockMiddleware({
    blockNum: 100,
    urlPrefix: '/static/js/index.js',
  });

  const port = await getRandomPort();
  const rsbuild = await createRsbuildWithMiddleware(
    blockedMiddleware,
    {
      minify: true,
      domain: [`http://localhost:${port}`, 'http://a.com', 'http://b.com'],
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
  );

  const { onRetryContextList, onFailContextList, onSuccessContextList } =
    await proxyPageConsole(page, rsbuild.port);

  await gotoPage(page, rsbuild);
  await delay();

  expect({
    onRetryContextList,
    onFailContextList,
    onSuccessContextList,
  }).toMatchObject({
    onRetryContextList: [
      {
        times: 0,
        domain: '<ORIGIN>',
        url: '<ORIGIN>/static/js/index.js',
        tagName: 'script',
        isAsyncChunk: false,
      },
      {
        times: 1,
        domain: 'http://a.com',
        url: 'http://a.com/static/js/index.js',
        tagName: 'script',
        isAsyncChunk: false,
      },
      {
        times: 2,
        domain: 'http://b.com',
        url: 'http://b.com/static/js/index.js',
        tagName: 'script',
        isAsyncChunk: false,
      },
    ],
    onFailContextList: [
      {
        times: 3,
        domain: '<ORIGIN>',
        url: '<ORIGIN>/static/js/index.js',
        tagName: 'script',
        isAsyncChunk: false,
      },
    ],
    onSuccessContextList: [],
  });
  await rsbuild.close();
});

test('@rsbuild/plugin-assets-retry onRetry and onFail options should work in failed retrying async chunk', async ({
  page,
}) => {
  const blockedMiddleware = createBlockMiddleware({
    blockNum: 100,
    urlPrefix: '/static/js/async/src_AsyncCompTest_tsx.js',
  });

  const port = await getRandomPort();
  const rsbuild = await createRsbuildWithMiddleware(
    blockedMiddleware,
    {
      minify: true,
      domain: [`http://localhost:${port}`, 'http://a.com', 'http://b.com'],
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
  );

  const { onRetryContextList, onFailContextList, onSuccessContextList } =
    await proxyPageConsole(page, rsbuild.port);

  await gotoPage(page, rsbuild);
  const compTestElement = page.locator('#async-comp-test-error');
  await expect(compTestElement).toHaveText(
    /ChunkLoadError: Loading chunk src_AsyncCompTest_tsx from \/static\/js\/async\/src_AsyncCompTest_tsx\.js failed after 3 retries: "Loading chunk src_AsyncCompTest_tsx failed.*/,
  );
  await delay();

  expect({
    onRetryContextList,
    onFailContextList,
    onSuccessContextList,
  }).toMatchObject({
    onRetryContextList: [
      {
        times: 0,
        domain: '<ORIGIN>',
        url: '<ORIGIN>/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
        isAsyncChunk: true,
      },
      {
        times: 1,
        domain: 'http://a.com',
        url: 'http://a.com/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
        isAsyncChunk: true,
      },
      {
        times: 2,
        domain: 'http://b.com',
        url: 'http://b.com/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
        isAsyncChunk: true,
      },
    ],
    onFailContextList: [
      {
        times: 3,
        domain: '<ORIGIN>',
        url: '<ORIGIN>/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
        isAsyncChunk: true,
      },
    ],
    onSuccessContextList: [],
  });
  await rsbuild.close();
});

test('@rsbuild/plugin-assets-retry should work with addQuery boolean option', async ({
  page,
}) => {
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

test('@rsbuild/plugin-assets-retry should work with addQuery function type option', async ({
  page,
}) => {
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

test('@rsbuild/plugin-assets-retry should preserve users query when set addQuery option', async ({
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
