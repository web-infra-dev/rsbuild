import webpackDevMiddleware from '@rsbuild/shared/webpack-dev-middleware';
import type { Compiler, MultiCompiler } from 'webpack';
import {
  setupServerHooks,
  isMultiCompiler,
  isClientCompiler,
  type DevMiddleware,
} from '@rsbuild/shared';
import type { IncomingMessage, ServerResponse } from 'node:http';

const applyHMREntry = (
  compiler: Compiler | MultiCompiler,
  clientPath: string,
) => {
  const applyEntry = (clientEntry: string, compiler: Compiler) => {
    // @ts-expect-error compiler type mismatch
    if (isClientCompiler(compiler)) {
      new compiler.webpack.EntryPlugin(compiler.context, clientEntry, {
        name: undefined,
      }).apply(compiler);
    }
  };

  // apply dev server to client compiler, add hmr client to entry.
  if (isMultiCompiler(compiler)) {
    for (const target of compiler.compilers) {
      applyEntry(clientPath, target);
    }
  } else {
    applyEntry(clientPath, compiler);
  }
};

type IHookCallbacks = {
  onInvalid: () => void;
  onDone: (stats: any) => void;
};

const setupHooks = (
  compiler: Compiler | MultiCompiler,
  hookCallbacks: IHookCallbacks,
) => {
  if (isMultiCompiler(compiler)) {
    for (const target of compiler.compilers) {
      setupServerHooks(target, hookCallbacks);
    }
  } else {
    setupServerHooks(compiler, hookCallbacks);
  }
};

export const getDevMiddleware: (
  compiler: Compiler | MultiCompiler,
) => NonNullable<DevMiddleware> = (compiler) => (options) => {
  const { hmrClientPath, callbacks, ...restOptions } = options;

  hmrClientPath && applyHMREntry(compiler, hmrClientPath);

  // register hooks for each compilation, update socket stats if recompiled
  setupHooks(compiler, callbacks);

  return webpackDevMiddleware(
    compiler,
    restOptions as webpackDevMiddleware.Options<
      IncomingMessage,
      ServerResponse
    >,
  );
};
