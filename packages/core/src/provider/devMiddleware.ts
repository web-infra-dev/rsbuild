import webpackDevMiddleware from '@rsbuild/shared/webpack-dev-middleware';
import {
  isClientCompiler,
  isMultiCompiler,
  setupServerHooks,
  type DevMiddleware,
} from '@rsbuild/shared';
import type { Compiler, MultiCompiler } from '@rspack/core';

function applyHMREntry(compiler: Compiler, clientPath: string) {
  if (!isClientCompiler(compiler)) {
    return;
  }

  new compiler.webpack.EntryPlugin(compiler.context, clientPath, {
    name: undefined,
  }).apply(compiler);
}

export const getDevMiddleware =
  (multiCompiler: Compiler | MultiCompiler): NonNullable<DevMiddleware> =>
  (options) => {
    const { hmrClientPath, callbacks, ...restOptions } = options;

    const setupCompiler = (compiler: Compiler) => {
      if (hmrClientPath) {
        applyHMREntry(compiler, hmrClientPath);
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
