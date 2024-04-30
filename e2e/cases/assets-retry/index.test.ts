import { dev, gotoPage, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginAssetsRetry } from '@rsbuild/plugin-assets-retry';
import type { PluginAssetsRetryOptions } from '@rsbuild/plugin-assets-retry';
import { pluginReact } from '@rsbuild/plugin-react';
import type { RequestHandler } from '@rsbuild/shared';
import stripAnsi from 'strip-ansi';

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
  middleware: RequestHandler,
  options: PluginAssetsRetryOptions,
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
            middlewares.unshift(middleware);
          },
        ],
      },
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
