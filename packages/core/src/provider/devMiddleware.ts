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
  hmrClientPaths,
  RSBUILD_HMR_OPTIONS,
}: {
  compiler: Compiler;
  hmrClientPaths: string[];
  RSBUILD_HMR_OPTIONS: DevConfig['client'];
}) {
  if (!isClientCompiler(compiler)) {
    return;
  }

  new compiler.webpack.DefinePlugin({
    RSBUILD_HMR_OPTIONS: JSON.stringify(RSBUILD_HMR_OPTIONS),
  }).apply(compiler);

  for (const clientPath of hmrClientPaths) {
    new compiler.webpack.EntryPlugin(compiler.context, clientPath, {
      name: undefined,
    }).apply(compiler);
  }
}

export const getDevMiddleware =
  (multiCompiler: Compiler | MultiCompiler): NonNullable<DevMiddleware> =>
  (options) => {
    const { hmrClientPaths, RSBUILD_HMR_OPTIONS, callbacks, ...restOptions } =
      options;

    const setupCompiler = (compiler: Compiler) => {
      if (hmrClientPaths) {
        applyHMREntry({
          compiler,
          hmrClientPaths,
          RSBUILD_HMR_OPTIONS,
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
