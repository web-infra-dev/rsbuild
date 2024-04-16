import { expect, test } from '@playwright/test';
import { dev, gotoPage, proxyConsole } from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginAssetsRetry } from '@rsbuild/plugin-assets-retry';
import type { PluginAssetsRetryOptions } from '@rsbuild/plugin-assets-retry';
import type { RequestHandler } from '@rsbuild/shared';

function stripAnsi(content: string) {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
  ].join('|');

  const regex = new RegExp(pattern, 'g');

  return content.replace(regex, '');
}

function count404Response(logs: string[]) {
  let count = 0;
  for (const log of logs) {
    if (stripAnsi(log).includes('404')) {
      count++;
    }
  }
  return count;
}

function createBlockedMiddleware(): RequestHandler {
  let counter = 0;
  return (req, res, next) => {
    if (req.url?.startsWith('/static/js/index.js')) {
      counter++;
      if (counter % 4 !== 0) {
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
        writeToDisk: true,
        setupMiddlewares: [
          (middlewares, _server) => {
            middlewares.unshift(middleware);
          },
        ],
      },
      output: {
        minify: false,
      },
    },
  });
  return rsbuild;
}

test('@rsbuild/plugin-assets-retry should work when block index.js`', async ({
  page,
}) => {
  process.env.DEBUG = 'rsbuild';
  const { logs, restore } = proxyConsole();
  const blockedMiddleware = createBlockedMiddleware();
  const rsbuild = await createRsbuildWithMiddleware(blockedMiddleware, {});

  await gotoPage(page, rsbuild);
  const testAsyncCompEle = page.locator('#comp-test');
  await expect(testAsyncCompEle).toHaveText('Hello CompTest');
  const blockedResponseCount = count404Response(logs);
  expect(blockedResponseCount).toBe(3);
  await rsbuild.close();
  restore();
});

test('@rsbuild/plugin-assets-retry should work when block index.js and minified runtime`', async ({
  page,
}) => {
  process.env.DEBUG = 'rsbuild';
  const { logs, restore } = proxyConsole();
  const blockedMiddleware = createBlockedMiddleware();
  const rsbuild = await createRsbuildWithMiddleware(blockedMiddleware, {
    minify: true,
  });

  await gotoPage(page, rsbuild);
  const testAsyncCompEle = page.locator('#comp-test');
  await expect(testAsyncCompEle).toHaveText('Hello CompTest');
  const blockedResponseCount = count404Response(logs);
  expect(blockedResponseCount).toBe(3);
  await rsbuild.close();
  restore();
});
