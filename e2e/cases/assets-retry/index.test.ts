import { dev, gotoPage, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginAssetsRetry } from '@rsbuild/plugin-assets-retry';
import type { PluginAssetsRetryOptions } from '@rsbuild/plugin-assets-retry';
import { pluginReact } from '@rsbuild/plugin-react';
import type { RequestHandler } from '@rsbuild/shared';
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
  process.env.DEBUG = 'rsbuild';
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
  delete process.env.DEBUG;
});

test('@rsbuild/plugin-assets-retry should work with minified runtime code when blocking initial chunk index.js', async ({
  page,
}) => {
  process.env.DEBUG = 'rsbuild';
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
  delete process.env.DEBUG;
});

test('@rsbuild/plugin-assets-retry should work when blocking async chunk`', async ({
  page,
}) => {
  process.env.DEBUG = 'rsbuild';
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
  delete process.env.DEBUG;
});

test('@rsbuild/plugin-assets-retry should work with minified runtime code when blocking async chunk', async ({
  page,
}) => {
  process.env.DEBUG = 'rsbuild';
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
  delete process.env.DEBUG;
});

test('@rsbuild/plugin-assets-retry should catch error by react ErrorBoundary when all retries failed', async ({
  page,
}) => {
  process.env.DEBUG = 'rsbuild';
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
  delete process.env.DEBUG;
});

function delay(ms = 300) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(1);
    }, ms);
  });
}

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

  const onRetryContextList: AssetsRetryHookContext[] = [];
  const onSuccessContextList: AssetsRetryHookContext[] = [];
  const onFailContextList: AssetsRetryHookContext[] = [];

  page.on('console', async (msg) => {
    if (msg.type() !== 'info') {
      return;
    }
    const typeValue = await msg.args()[0].jsonValue();
    const contextValue = await msg.args()[1].jsonValue();

    if (typeValue === 'onRetry') {
      onRetryContextList.push(contextValue);
    } else if (typeValue === 'onSuccess') {
      onSuccessContextList.push(contextValue);
    } else if (typeValue === 'onFail') {
      onFailContextList.push(contextValue);
    }
  });

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
        domain: '/',
        url: '/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
      },
      {
        times: 1,
        domain: '/',
        url: '/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
      },
      {
        times: 2,
        domain: '/',
        url: '/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
      },
    ],
    onFailContextList: [],
    onSuccessContextList: [
      {
        times: 3,
        domain: '/',
        url: '/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
      },
    ],
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

  const onRetryContextList: AssetsRetryHookContext[] = [];
  const onSuccessContextList: AssetsRetryHookContext[] = [];
  const onFailContextList: AssetsRetryHookContext[] = [];
  page.on('console', async (msg) => {
    if (msg.type() !== 'info') {
      return;
    }
    const typeValue = await msg.args()?.[0].jsonValue();
    const contextValue = await msg.args()?.[1].jsonValue();

    if (typeValue === 'onRetry') {
      onRetryContextList.push(contextValue);
    } else if (typeValue === 'onSuccess') {
      onSuccessContextList.push(contextValue);
    } else if (typeValue === 'onFail') {
      onFailContextList.push(contextValue);
    }
  });

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
        domain: '/',
        url: '/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
      },
      {
        times: 1,
        domain: '/',
        url: '/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
      },
      {
        times: 2,
        domain: '/',
        url: '/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
      },
    ],
    onFailContextList: [
      {
        times: 3,
        domain: '/',
        url: '/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
      },
    ],
    onSuccessContextList: [],
  });
  await rsbuild.close();
});

test('@rsbuild/plugin-assets-retry should work with addQuery boolean option', async ({
  page,
}) => {
  process.env.DEBUG = 'rsbuild';
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
  delete process.env.DEBUG;
});

test('@rsbuild/plugin-assets-retry should work with addQuery function type option', async ({
  page,
}) => {
  process.env.DEBUG = 'rsbuild';
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
      addQuery: (times, originalQuery) => {
        if (originalQuery !== '') {
          return times === 3
            ? `${originalQuery}&retryCount=${times}&isLast=1`
            : `${originalQuery}&retryCount=${times}`;
        }
        return times === 3
          ? `?retryCount=${times}&isLast=1`
          : `?retryCount=${times}`;
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
  delete process.env.DEBUG;
});

test('@rsbuild/plugin-assets-retry should preserve users query when set addQuery option', async ({
  page,
}) => {
  process.env.DEBUG = 'rsbuild';
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
  delete process.env.DEBUG;
});
