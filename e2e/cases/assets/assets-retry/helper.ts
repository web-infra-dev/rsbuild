import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { dev } from '@e2e/helper';
import type { Page } from '@playwright/test';
import type { RequestHandler } from '@rsbuild/core';
import { pluginAssetsRetry } from '@rsbuild/plugin-assets-retry';
import type { PluginAssetsRetryOptions } from '@rsbuild/plugin-assets-retry';
import { pluginReact } from '@rsbuild/plugin-react';

// TODO: write a common testMiddleware instead of collect DEBUG logger

export function count404Response(logs: string[], urlPrefix: string): number {
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

export function count404ResponseByUrl(
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

export type AssetsRetryHookContext = {
  url: string;
  times: number;
  domain: string;
  tagName: string;
};

export function createBlockMiddleware({
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

export async function createRsbuildWithMiddleware(
  middleware: RequestHandler | RequestHandler[],
  options: PluginAssetsRetryOptions,
  entry?: string,
  port?: number,
  assetPrefix?: string,
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
        ...(assetPrefix
          ? {
              assetPrefix,
            }
          : {}),
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
        sourceMap: false,
      },
    },
  });
  return rsbuild;
}

export function delay(ms = 300) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(1);
    }, ms);
  });
}

export async function proxyPageConsole(page: Page, port: number) {
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
