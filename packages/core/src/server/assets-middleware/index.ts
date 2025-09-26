/**
 * The assets middleware is modified based on
 * https://github.com/webpack/webpack-dev-middleware
 *
 * MIT Licensed
 * Copyright JS Foundation and other contributors
 * https://github.com/webpack/webpack-dev-middleware/blob/master/LICENSE
 */
import type { Stats as FSStats, ReadStream } from 'node:fs';
import type { ServerResponse as NodeServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import type { Compiler, MultiCompiler, Watching } from '@rspack/core';
import { applyToCompiler, isMultiCompiler } from '../../helpers';
import { logger } from '../../logger';
import type {
  EnvironmentContext,
  NormalizedConfig,
  NormalizedDevConfig,
  NormalizedEnvironmentConfig,
  RequestHandler,
} from '../../types';
import { resolveHostname } from './../hmrFallback';
import type { SocketServer } from '../socketServer';
import { wrapper as createMiddleware } from './middleware';
import { setupHooks } from './setupHooks';
import { setupOutputFileSystem } from './setupOutputFileSystem';
import { resolveWriteToDiskConfig, setupWriteToDisk } from './setupWriteToDisk';

const noop = () => {};

export type ServerResponse = NodeServerResponse & {
  locals?: { webpack?: { devMiddleware?: Context } };
};

export type MultiWatching = ReturnType<MultiCompiler['watch']>;

// TODO: refine types to match underlying fs-like implementations
export type OutputFileSystem = {
  createReadStream?: (
    p: string,
    opts: { start: number; end: number },
  ) => ReadStream;
  statSync?: (p: string) => FSStats;
  readFileSync?: (p: string) => Buffer;
};

export type Options = {
  writeToDisk?:
    | boolean
    | ((targetPath: string, compilationName?: string) => boolean);
};

export type Context = {
  ready: boolean;
  callbacks: (() => void)[];
};

export type AssetsMiddlewareClose = (
  callback: (err?: Error | null) => void,
) => void;

export type AssetsMiddleware = RequestHandler & {
  watch: () => void;
  close: AssetsMiddlewareClose;
};

const require = createRequire(import.meta.url);
let hmrClientPath: string;
let overlayClientPath: string;

function getClientPaths(devConfig: NormalizedDevConfig) {
  const clientPaths: string[] = [];

  if (!devConfig.hmr && !devConfig.liveReload) {
    return clientPaths;
  }

  if (!hmrClientPath) {
    hmrClientPath = require.resolve('@rsbuild/core/client/hmr');
  }
  clientPaths.push(hmrClientPath);

  if (devConfig.client?.overlay) {
    if (!overlayClientPath) {
      overlayClientPath = require.resolve('@rsbuild/core/client/overlay');
    }
    clientPaths.push(overlayClientPath);
  }

  return clientPaths;
}

export const isClientCompiler = (compiler: {
  options: {
    target?: Compiler['options']['target'];
  };
}): boolean => {
  const { target } = compiler.options;

  if (target) {
    return Array.isArray(target) ? target.includes('web') : target === 'web';
  }

  return false;
};

const isNodeCompiler = (compiler: {
  options: {
    target?: Compiler['options']['target'];
  };
}) => {
  const { target } = compiler.options;

  if (target) {
    return Array.isArray(target) ? target.includes('node') : target === 'node';
  }

  return false;
};

export const setupServerHooks = ({
  compiler,
  token,
  socketServer,
}: {
  compiler: Compiler;
  token: string;
  socketServer: SocketServer;
}): void => {
  // TODO: node SSR HMR is not supported yet
  if (isNodeCompiler(compiler)) {
    return;
  }

  const { invalid, done } = compiler.hooks;

  invalid.tap('rsbuild-dev-server', (fileName) => {
    // reload page when HTML template changed
    if (typeof fileName === 'string' && fileName.endsWith('.html')) {
      socketServer.sockWrite({ type: 'static-changed' }, token);
      return;
    }
  });
  done.tap('rsbuild-dev-server', (stats) => {
    socketServer.updateStats(stats, token);
  });
};

function applyHMREntry({
  config,
  compiler,
  token,
  resolvedHost,
  resolvedPort,
}: {
  config: NormalizedEnvironmentConfig;
  compiler: Compiler;
  token: string;
  resolvedHost: string;
  resolvedPort: number;
}) {
  if (!isClientCompiler(compiler)) {
    return;
  }

  const clientPaths = getClientPaths(config.dev);
  if (!clientPaths.length) {
    return;
  }

  const clientConfig = { ...config.dev.client };
  if (clientConfig.port === '<port>') {
    clientConfig.port = resolvedPort;
  }

  new compiler.webpack.DefinePlugin({
    RSBUILD_WEB_SOCKET_TOKEN: JSON.stringify(token),
    RSBUILD_CLIENT_CONFIG: JSON.stringify(clientConfig),
    RSBUILD_SERVER_HOST: JSON.stringify(resolvedHost),
    RSBUILD_SERVER_PORT: JSON.stringify(resolvedPort),
    RSBUILD_DEV_LIVE_RELOAD: config.dev.liveReload,
    RSBUILD_DEV_BROWSER_LOGS: config.dev.browserLogs,
  }).apply(compiler);

  for (const clientPath of clientPaths) {
    new compiler.webpack.EntryPlugin(compiler.context, clientPath, {
      name: undefined,
    }).apply(compiler);
  }
}

/**
 * The assets middleware handles compiler setup for development:
 * - Call `compiler.watch`
 * - Inject the HMR client path into page
 * - Notify server when compiler hooks are triggered
 */
export const assetsMiddleware = async ({
  config,
  compiler,
  socketServer,
  environments,
  resolvedPort,
}: {
  config: NormalizedConfig;
  compiler: Compiler | MultiCompiler;
  socketServer: SocketServer;
  environments: Record<string, EnvironmentContext>;
  resolvedPort: number;
}): Promise<AssetsMiddleware> => {
  const resolvedHost = await resolveHostname(config.server.host);

  const setupCompiler = (compiler: Compiler, index: number) => {
    const environment = Object.values(environments).find(
      (env) => env.index === index,
    );
    if (!environment) {
      return;
    }

    const token = environment.webSocketToken;
    if (!token) {
      return;
    }

    applyHMREntry({
      token,
      config: environment.config,
      compiler,
      resolvedHost,
      resolvedPort,
    });

    // register hooks for each compilation, update socket stats if recompiled
    setupServerHooks({
      compiler,
      socketServer,
      token,
    });
  };

  applyToCompiler(compiler, setupCompiler);

  const compilers = isMultiCompiler(compiler) ? compiler.compilers : [compiler];
  const context: Context = {
    ready: false,
    callbacks: [],
  };

  setupHooks(context, compiler);

  const writeToDisk = resolveWriteToDiskConfig(config.dev, environments);
  if (writeToDisk) {
    setupWriteToDisk(compilers, writeToDisk);
  }

  const outputFileSystem = await setupOutputFileSystem(writeToDisk, compilers);

  const instance = createMiddleware(
    context,
    outputFileSystem,
    environments,
  ) as AssetsMiddleware;

  let watching: Watching | MultiWatching | undefined;

  // API
  instance.watch = () => {
    if (compiler.watching) {
      watching = compiler.watching;
    } else {
      const errorHandler = (error: Error | null | undefined) => {
        if (error) {
          if (error.message?.includes('× Error:')) {
            error.message = error.message.replace('× Error:', '').trim();
          }
          logger.error(error);
        }
      };

      const watchOptions =
        compilers.length > 1
          ? compilers.map(({ options }) => options.watchOptions || {})
          : compilers[0].options.watchOptions || {};
      watching = compiler.watch(watchOptions, errorHandler);
    }
  };

  instance.close = ((callback = noop) => {
    watching?.close(callback);
  }) satisfies AssetsMiddlewareClose;

  return instance;
};
