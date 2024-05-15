import {
  type DevConfig,
  type DevMiddleware,
  applyToCompiler,
  isClientCompiler,
  setupServerHooks,
} from '@rsbuild/shared';
import type { Compiler, MultiCompiler } from '@rspack/core';
import webpackDevMiddleware from '../../compiled/webpack-dev-middleware/index.js';

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

export const getDevMiddleware =
  (multiCompiler: Compiler | MultiCompiler): NonNullable<DevMiddleware> =>
  (options) => {
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
