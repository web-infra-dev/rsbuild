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
import type {
  Compiler,
  Configuration,
  MultiCompiler,
  MultiStats,
  Stats,
  Watching,
} from '@rspack/core';
import { applyToCompiler, isMultiCompiler } from '../../helpers';
import { logger } from '../../logger';
import type {
  EnvironmentContext,
  NormalizedConfig,
  NormalizedDevConfig,
  NormalizedEnvironmentConfig,
  RequestHandler,
  WriteToDisk,
} from '../../types';
import { resolveHostname } from './../hmrFallback';
import { wrapper as createMiddleware } from './middleware';
import { setupHooks } from './setupHooks';
import { setupOutputFileSystem } from './setupOutputFileSystem';
import { setupWriteToDisk } from './setupWriteToDisk';

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
  lstat?: (p: string) => unknown; // TODO: type
  readFileSync?: (p: string) => Buffer;
};

export type Options = {
  writeToDisk?:
    | boolean
    | ((targetPath: string, compilationName?: string) => boolean);
  publicPath?: NonNullable<Configuration['output']>['publicPath'];
};

export type Context = {
  stats: Stats | MultiStats | undefined;
  callbacks: (() => void)[];
  options: Options;
  watching: Watching | MultiWatching | undefined;
  outputFileSystem: OutputFileSystem;
};

export type FilledContext = Omit<Context, 'watching'> & {
  watching: Watching | MultiWatching;
};

export type Close = (callback: (err: Error | null | undefined) => void) => void;

export type AssetsMiddleware = RequestHandler & {
  watch: () => void;
  close: Close;
};

export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export async function assetsMiddleware(
  compiler: Compiler | MultiCompiler,
  options: Options = {},
): Promise<AssetsMiddleware> {
  const compilers = isMultiCompiler(compiler) ? compiler.compilers : [compiler];
  const context: WithOptional<Context, 'watching' | 'outputFileSystem'> = {
    stats: undefined,
    callbacks: [],
    options,
  };

  setupHooks(context, compiler);

  if (options.writeToDisk) {
    setupWriteToDisk(compilers, options);
  }

  context.outputFileSystem = await setupOutputFileSystem(options, compilers);

  const filledContext = context as FilledContext;

  const instance = (
    createMiddleware as (ctx: FilledContext) => AssetsMiddleware
  )(filledContext);

  // API
  instance.watch = () => {
    if (compiler.watching) {
      context.watching = compiler.watching;
    } else {
      const errorHandler = (error: Error | null | undefined) => {
        if (error) {
          if (error.message?.includes('× Error:')) {
            error.message = error.message.replace('× Error:', '').trim();
          }
          logger.error(error);
        }
      };

      if (compilers.length > 1) {
        const watchOptions = compilers.map(
          (childCompiler) => childCompiler.options.watchOptions || {},
        );
        context.watching = compiler.watch(watchOptions, errorHandler);
      } else {
        const watchOptions = compilers[0].options.watchOptions || {};
        context.watching = compiler.watch(watchOptions, errorHandler);
      }
    }
  };

  instance.close = (callback: (err?: Error | null) => void = noop) => {
    filledContext.watching?.close(callback);
  };

  return instance;
}

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

export type ServerCallbacks = {
  onInvalid: (token: string, fileName?: string | null) => void;
  onDone: (token: string, stats: Stats) => void;
};

export const setupServerHooks = ({
  compiler,
  token,
  callbacks: { onDone, onInvalid },
}: {
  compiler: Compiler;
  token: string;
  callbacks: ServerCallbacks;
}): void => {
  // TODO: node SSR HMR is not supported yet
  if (isNodeCompiler(compiler)) {
    return;
  }

  const { compile, invalid, done } = compiler.hooks;

  compile.tap('rsbuild-dev-server', () => {
    onInvalid(token);
  });
  invalid.tap('rsbuild-dev-server', (fileName) => {
    onInvalid(token, fileName);
  });
  done.tap('rsbuild-dev-server', (stats) => {
    onDone(token, stats);
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
 * Resolve writeToDisk config across multiple environments.
 * Returns the unified config if all environments have the same value,
 * otherwise returns a function that resolves config based on compilation.
 */
const resolveWriteToDiskConfig = (
  config: NormalizedDevConfig,
  environments: Record<string, EnvironmentContext>,
): WriteToDisk => {
  const writeToDiskValues = Object.values(environments).map(
    (env) => env.config.dev.writeToDisk,
  );
  if (new Set(writeToDiskValues).size === 1) {
    return writeToDiskValues[0];
  }

  return (filePath: string, name?: string) => {
    let { writeToDisk } = config;
    if (name && environments[name]) {
      writeToDisk = environments[name].config.dev.writeToDisk ?? writeToDisk;
    }
    return typeof writeToDisk === 'function'
      ? writeToDisk(filePath)
      : writeToDisk;
  };
};

/**
 * The assets middleware handles compiler setup for development:
 * - Call `compiler.watch`
 * - Inject the HMR client path into page
 * - Notify server when compiler hooks are triggered
 */
export const getAssetsMiddleware = async ({
  config,
  compiler,
  callbacks,
  environments,
  resolvedPort,
}: {
  config: NormalizedConfig;
  compiler: Compiler | MultiCompiler;
  /**
   * Should trigger when compiler hook called
   */
  callbacks: ServerCallbacks;
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
      callbacks,
      token,
    });
  };

  applyToCompiler(compiler, setupCompiler);

  return assetsMiddleware(compiler, {
    publicPath: '/',
    writeToDisk: resolveWriteToDiskConfig(config.dev, environments),
  });
};
