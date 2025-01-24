import { getRandomPort, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import {
  createBlockMiddleware,
  createRsbuildWithMiddleware,
  delay,
  proxyPageConsole,
} from './helper';

test('onRetry and onSuccess options should work when retrying async chunk successfully', async ({
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

test('domain, onRetry and onFail options should work when retrying async chunk failed', async ({
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
      domain: [
        `http://localhost:${port}`,
        'http://a.com/foo-path',
        'http://b.com',
      ],
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
    /ChunkLoadError: Loading chunk src_AsyncCompTest_tsx from "static\/js\/async\/src_AsyncCompTest_tsx\.js" failed after 3 retries: "Loading chunk src_AsyncCompTest_tsx failed.*/,
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
        domain: 'http://a.com/foo-path',
        url: 'http://a.com/foo-path/static/js/async/src_AsyncCompTest_tsx.js',
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

test('onRetry and onFail options should work when multiple parallel retrying async chunk', async ({
  page,
}) => {
  const blockedMiddleware = createBlockMiddleware({
    blockNum: 100,
    urlPrefix: '/static/js/async/src_AsyncCompTest_tsx.js',
  });

  const rsbuild = await createRsbuildWithMiddleware(
    blockedMiddleware,
    {
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
    },
    './src/testParallelRetryEntry.js',
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
        url: '<ORIGIN>/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
        isAsyncChunk: true,
      },
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
      {
        times: 2,
        domain: '<ORIGIN>',
        url: '<ORIGIN>/static/js/async/src_AsyncCompTest_tsx.js',
        tagName: 'script',
        isAsyncChunk: true,
      },
    ],
    onFailContextList: [
      {
        domain: '<ORIGIN>',
        isAsyncChunk: true,
        tagName: 'script',
        times: 3,
        url: '<ORIGIN>/static/js/async/src_AsyncCompTest_tsx.js',
      },
      {
        domain: '<ORIGIN>',
        isAsyncChunk: true,
        tagName: 'script',
        times: 3,
        url: '<ORIGIN>/static/js/async/src_AsyncCompTest_tsx.js',
      },
    ],
    onSuccessContextList: [],
  });
  await rsbuild.close();
});
