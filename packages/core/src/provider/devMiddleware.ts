import webpackDevMiddleware from '@rsbuild/shared/webpack-dev-middleware';
import {
  isClientCompiler,
  isMultiCompiler,
  setupServerHooks,
  type DevConfig,
  type DevMiddleware,
} from '@rsbuild/shared';
import type { Compiler, MultiCompiler } from '@rspack/core';

function applyHMREntry({
  compiler,
  clientPaths,
  clientConfig = {},
}: {
  compiler: Compiler;
  clientPaths: string[];
  clientConfig: DevConfig['client'];
}) {
  if (!isClientCompiler(compiler)) {
    return;
  }

  new compiler.webpack.DefinePlugin({
    RSBUILD_CLIENT_CONFIG: JSON.stringify(clientConfig),
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
    const { clientPaths, clientConfig, callbacks, ...restOptions } = options;

    const setupCompiler = (compiler: Compiler) => {
      if (clientPaths) {
        applyHMREntry({
          compiler,
          clientPaths,
          clientConfig,
        });
      }
      // register hooks for each compilation, update socket stats if recompiled
      setupServerHooks(compiler, callbacks);
    };

    if (isMultiCompiler(multiCompiler)) {
      multiCompiler.compilers.forEach(setupCompiler);
    } else {
      setupCompiler(multiCompiler);
    }

    // @ts-expect-error compiler type mismatch
    return webpackDevMiddleware(multiCompiler, restOptions);
  };
