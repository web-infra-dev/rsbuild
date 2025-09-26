import type { Compiler, MultiCompiler } from '@rspack/core';
import type { Context } from './index';

export function setupHooks(
  context: Context,
  compiler: Compiler | MultiCompiler,
): void {
  function invalid() {
    context.ready = false;
  }

  function done() {
    context.ready = true;

    process.nextTick(() => {
      if (!context.ready) {
        return;
      }

      const { callbacks } = context;
      callbacks.forEach((callback) => {
        callback();
      });
      context.callbacks = [];
    });
  }

  compiler.hooks.watchRun.tap('rsbuild-dev-middleware', invalid);
  compiler.hooks.invalid.tap('rsbuild-dev-middleware', invalid);
  compiler.hooks.done.tap('rsbuild-dev-middleware', done);
}
