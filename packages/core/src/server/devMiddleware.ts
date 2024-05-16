import {
  type CompilerTapFn,
  type DevConfig,
  type DevMiddleware,
  applyToCompiler,
  isClientCompiler,
  isNodeCompiler,
} from '@rsbuild/shared';
import type { Compiler, MultiCompiler } from '@rspack/core';

type ServerCallbacks = {
  onInvalid: () => void;
  onDone: (stats: any) => void;
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

export const getDevMiddleware = async (
  multiCompiler: Compiler | MultiCompiler,
): Promise<NonNullable<DevMiddleware>> => {
  const { default: webpackDevMiddleware } = await import(
    '../../compiled/webpack-dev-middleware/index.js'
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
