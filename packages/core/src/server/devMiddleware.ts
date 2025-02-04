import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Compiler, MultiCompiler } from '@rspack/core';
import { applyToCompiler } from '../helpers';
import type { DevMiddlewareOptions } from '../provider/createCompiler';
import type { DevConfig, NextFunction } from '../types';
import { getCompilationId } from './helper';
import { getResolvedClientConfig } from './hmrFallback';

type ServerCallbacks = {
  onInvalid: (compilationId?: string, fileName?: string | null) => void;
  onDone: (stats: any) => void;
};

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

export const setupServerHooks = (
  compiler: Compiler,
  hookCallbacks: ServerCallbacks,
): void => {
  // TODO: node SSR HMR is not supported yet
  if (isNodeCompiler(compiler)) {
    return;
  }

  const { compile, invalid, done } = compiler.hooks;

  compile.tap('rsbuild-dev-server', () => {
    hookCallbacks.onInvalid(getCompilationId(compiler));
  });
  invalid.tap('rsbuild-dev-server', (fileName) => {
    hookCallbacks.onInvalid(getCompilationId(compiler), fileName);
  });
  done.tap('rsbuild-dev-server', hookCallbacks.onDone);
};

function applyHMREntry({
  compiler,
  clientPaths,
  clientConfig = {},
  resolvedClientConfig = {},
  liveReload = true,
}: {
  compiler: Compiler;
  clientPaths: string[];
  clientConfig: DevConfig['client'];
  resolvedClientConfig: DevConfig['client'];
  liveReload: DevConfig['liveReload'];
}) {
  if (!isClientCompiler(compiler)) {
    return;
  }

  new compiler.webpack.DefinePlugin({
    RSBUILD_COMPILATION_NAME: JSON.stringify(getCompilationId(compiler)),
    RSBUILD_CLIENT_CONFIG: JSON.stringify(clientConfig),
    RSBUILD_RESOLVED_CLIENT_CONFIG: JSON.stringify(resolvedClientConfig),
    RSBUILD_DEV_LIVE_RELOAD: liveReload,
  }).apply(compiler);

  for (const clientPath of clientPaths) {
    new compiler.webpack.EntryPlugin(compiler.context, clientPath, {
      name: undefined,
    }).apply(compiler);
  }
}

export type Middleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => Promise<void>;

export type DevMiddlewareAPI = Middleware & {
  close: (callback: (err: Error | null | undefined) => void) => any;
};

/**
 * The rsbuild/server do nothing about compiler, the devMiddleware need do such things to ensure dev works well:
 * - Call compiler.watch （normally did by rsbuild-dev-middleware）.
 * - Inject the HMR client path into page （the HMR client rsbuild/server already provide）.
 * - Notify server when compiler hooks are triggered.
 */
export type DevMiddleware = (
  options: DevMiddlewareOptions,
) => Promise<DevMiddlewareAPI>;

export const getDevMiddleware = async (
  multiCompiler: Compiler | MultiCompiler,
): Promise<NonNullable<DevMiddleware>> => {
  const { default: rsbuildDevMiddleware } = await import(
    '../../compiled/rsbuild-dev-middleware/index.js'
  );
  return async (options) => {
    const {
      clientPaths,
      clientConfig,
      callbacks,
      liveReload,
      serverConfig,
      ...restOptions
    } = options;
    const resolvedClientConfig = await getResolvedClientConfig(
      clientConfig,
      serverConfig,
    );

    const setupCompiler = (compiler: Compiler) => {
      if (clientPaths) {
        applyHMREntry({
          compiler,
          clientPaths,
          clientConfig,
          resolvedClientConfig,
          liveReload,
        });
      }
      // register hooks for each compilation, update socket stats if recompiled
      setupServerHooks(compiler, callbacks);
    };

    applyToCompiler(multiCompiler, setupCompiler);

    return rsbuildDevMiddleware(multiCompiler, restOptions);
  };
};
