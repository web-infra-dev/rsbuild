import type { Compiler, MultiCompiler, MultiStats, Stats } from '@rspack/core';
import type { Context, WithOptional } from './index';

export function setupHooks(
  context: WithOptional<Context, 'watching' | 'outputFileSystem'>,
  compiler: Compiler | MultiCompiler,
): void {
  function invalid() {
    context.stats = undefined;
  }

  function done(stats: Stats | MultiStats) {
    context.stats = stats;

    process.nextTick(() => {
      const { stats, callbacks } = context;

      if (!stats) {
        return;
      }

      context.callbacks = [];

      callbacks.forEach((callback) => {
        callback();
      });
    });
  }

  compiler.hooks.watchRun.tap('rsbuild-dev-middleware', invalid);
  compiler.hooks.invalid.tap('rsbuild-dev-middleware', invalid);
  compiler.hooks.done.tap('rsbuild-dev-middleware', done);
}
