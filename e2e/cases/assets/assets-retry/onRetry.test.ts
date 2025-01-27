import { getRandomPort, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import {
  createBlockMiddleware,
  createRsbuildWithMiddleware,
  delay,
  proxyPageConsole,
} from './helper';

test('onRetry and onSuccess options should work when retrying initial chunk successfully', async ({
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

test('domain, onRetry and onFail options should work when retrying initial chunk failed', async ({
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
        domain: 'http://a.com/foo-path',
        url: 'http://a.com/foo-path/static/js/index.js',
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
