import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CompilerTapFn, DevConfig, NextFunction } from '@rsbuild/shared';
import type { Compiler, MultiCompiler } from '@rspack/core';
import { applyToCompiler } from '../helpers';
import type { DevMiddlewareOptions } from '../provider/createCompiler';

type ServerCallbacks = {
  onInvalid: () => void;
  onDone: (stats: any) => void;
};

export const isClientCompiler = (compiler: {
  options: {
    target?: Compiler['options']['target'];
  };
}) => {
  const { target } = compiler.options;

  if (target) {
    return Array.isArray(target) ? target.includes('web') : target === 'web';
  }

  return false;
};

export const isNodeCompiler = (compiler: {
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
  compiler: {
    options: {
      target?: Compiler['options']['target'];
    };
    hooks: {
      compile: CompilerTapFn<ServerCallbacks['onInvalid']>;
      invalid: CompilerTapFn<ServerCallbacks['onInvalid']>;
      done: CompilerTapFn<ServerCallbacks['onDone']>;
    };
  },
  hookCallbacks: ServerCallbacks,
) => {
  // TODO: node SSR HMR is not supported yet
  if (isNodeCompiler(compiler)) {
    return;
  }

  const { compile, invalid, done } = compiler.hooks;

  compile.tap('rsbuild-dev-server', hookCallbacks.onInvalid);
  invalid.tap('rsbuild-dev-server', hookCallbacks.onInvalid);
  done.tap('rsbuild-dev-server', hookCallbacks.onDone);
};

function applyHMREntry({
  compiler,
  clientPaths,
  clientConfig = {},
  liveReload = true,
}: {
  compiler: Compiler;
  clientPaths: string[];
  clientConfig: DevConfig['client'];
  liveReload: DevConfig['liveReload'];
}) {
  if (!isClientCompiler(compiler)) {
    return;
  }

  new compiler.webpack.DefinePlugin({
    RSBUILD_CLIENT_CONFIG: JSON.stringify(clientConfig),
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
 * - Call compiler.watch （normally did by webpack-dev-middleware）.
 * - Inject the hmr client path into page （the hmr client rsbuild/server already provide）.
 * - Notify server when compiler hooks are triggered.
 */
export type DevMiddleware = (options: DevMiddlewareOptions) => DevMiddlewareAPI;

export const getDevMiddleware = async (
  multiCompiler: Compiler | MultiCompiler,
): Promise<NonNullable<DevMiddleware>> => {
  const { default: webpackDevMiddleware } = await import(
    'webpack-dev-middleware'
  );
  return (options) => {
    const { clientPaths, clientConfig, callbacks, liveReload, ...restOptions } =
      options;

    const setupCompiler = (compiler: Compiler) => {
      if (clientPaths) {
        applyHMREntry({
          compiler,
          clientPaths,
          clientConfig,
          liveReload,
        });
      }
      // register hooks for each compilation, update socket stats if recompiled
      setupServerHooks(compiler, callbacks);
    };

    applyToCompiler(multiCompiler, setupCompiler);

    return webpackDevMiddleware(multiCompiler, restOptions);
  };
};
