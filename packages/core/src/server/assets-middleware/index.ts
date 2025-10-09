/**
 * The assets middleware is modified based on
 * https://github.com/webpack/webpack-dev-middleware
 *
 * MIT Licensed
 * Copyright JS Foundation and other contributors
 * https://github.com/webpack/webpack-dev-middleware/blob/master/LICENSE
 */
import type { ReadStream } from 'node:fs';
import { createRequire } from 'node:module';
import type { Compiler, MultiCompiler, Watching } from '@rspack/core';
import { pick } from '../../helpers';
import { applyToCompiler, isMultiCompiler } from '../../helpers/compiler';
import { logger } from '../../logger';
import type {
  InternalContext,
  NormalizedConfig,
  NormalizedDevConfig,
  NormalizedEnvironmentConfig,
  RequestHandler,
  Rspack,
} from '../../types';
import { resolveHostname } from './../hmrFallback';
import type { SocketServer } from '../socketServer';
import { createMiddleware } from './middleware';
import { setupOutputFileSystem } from './setupOutputFileSystem';
import { resolveWriteToDiskConfig, setupWriteToDisk } from './setupWriteToDisk';

const noop = () => {};

export type MultiWatching = ReturnType<MultiCompiler['watch']>;

export type OutputFileSystem = Rspack.OutputFileSystem & {
  // TODO: can be removed after Rspack adding this type
  createReadStream?: (
    p: string,
    opts: { start: number; end: number },
  ) => ReadStream;
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

export const isClientCompiler = (compiler: Compiler): boolean => {
  const { target } = compiler.options;
  if (target) {
    return Array.isArray(target) ? target.includes('web') : target === 'web';
  }
  return false;
};

const isNodeCompiler = (compiler: Compiler) => {
  const { target } = compiler.options;
  if (target) {
    return Array.isArray(target) ? target.includes('node') : target === 'node';
  }
  return false;
};

const isTsError = (error: Rspack.RspackError) =>
  'message' in error && error.stack?.includes('ts-checker-rspack-plugin');

export const setupServerHooks = ({
  context,
  compiler,
  token,
  socketServer,
}: {
  context: InternalContext;
  compiler: Compiler;
  token: string;
  socketServer: SocketServer;
}): void => {
  // Node HMR is not supported yet
  if (isNodeCompiler(compiler)) {
    return;
  }

  // Track errors count to detect if the `done` hook is called multiple times
  let errorsCount: number | null = null;

  compiler.hooks.invalid.tap('rsbuild-dev-server', (fileName) => {
    errorsCount = null;

    // reload page when HTML template changed
    if (typeof fileName === 'string' && fileName.endsWith('.html')) {
      socketServer.sockWrite({ type: 'static-changed' }, token);
    }
  });

  compiler.hooks.done.tap('rsbuild-dev-server', (stats) => {
    const { errors } = stats.compilation;
    if (errors.length === errorsCount) {
      return;
    }

    const isRecalled = errorsCount !== null;
    errorsCount = errors.length;

    /**
     * The ts-checker-rspack-plugin asynchronously pushes Type errors to `compilation.errors`
     * and calls the `done` hook again, so we need to detect changes in errors and render them
     * in the overlay.
     */
    if (isRecalled) {
      const tsErrors = errors.filter(isTsError);
      if (!tsErrors.length) {
        return;
      }

      const { stats: statsJson } = context.buildState;
      const statsErrors = tsErrors.map((item) =>
        pick(item, ['message', 'file']),
      );

      if (statsJson) {
        statsJson.errors = statsJson.errors
          ? [...statsJson.errors, ...statsErrors]
          : statsErrors;
      }

      socketServer.sendError(statsErrors, token);
      return;
    }
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
  context,
  socketServer,
  resolvedPort,
}: {
  config: NormalizedConfig;
  compiler: Compiler | MultiCompiler;
  context: InternalContext;
  socketServer: SocketServer;
  resolvedPort: number;
}): Promise<AssetsMiddleware> => {
  const resolvedHost = await resolveHostname(config.server.host);
  const { environments } = context;

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
      context,
      compiler,
      socketServer,
      token,
    });
  };

  applyToCompiler(compiler, setupCompiler);

  const compilers = isMultiCompiler(compiler) ? compiler.compilers : [compiler];
  const callbacks: (() => void)[] = [];

  compiler.hooks.done.tap('rsbuild-dev-middleware', () => {
    process.nextTick(() => {
      if (!(context.buildState.status === 'done')) {
        return;
      }

      callbacks.forEach((callback) => {
        callback();
      });
      callbacks.length = 0;
    });
  });

  const writeToDisk = resolveWriteToDiskConfig(config.dev, environments);
  if (writeToDisk) {
    setupWriteToDisk(compilers, writeToDisk);
  }

  const outputFileSystem = setupOutputFileSystem(writeToDisk, compilers);

  const ready = (callback: () => void) => {
    if (context.buildState.status === 'done') {
      callback();
    } else {
      callbacks.push(callback);
    }
  };

  const instance = createMiddleware(
    context,
    ready,
    outputFileSystem,
  ) as AssetsMiddleware;

  let watching: Watching | MultiWatching | undefined;

  // API
  instance.watch = () => {
    if (compiler.watching) {
      watching = compiler.watching;
    } else {
      const watchOptions =
        compilers.length > 1
          ? compilers.map(({ options }) => options.watchOptions || {})
          : compilers[0].options.watchOptions || {};

      watching = compiler.watch(watchOptions, (error) => {
        if (error) {
          if (error.message?.includes('× Error:')) {
            error.message = error.message.replace('× Error:', '').trim();
          }
          logger.error(error);
        }
      });
    }
  };

  instance.close = ((callback = noop) => {
    watching?.close(callback);
  }) satisfies AssetsMiddlewareClose;

  return instance;
};
