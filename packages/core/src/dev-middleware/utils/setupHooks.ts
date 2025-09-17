import type { Compiler, MultiCompiler, MultiStats, Stats } from '@rspack/core';
import type { Context, WithOptional } from '../index';

export function setupHooks(
  context: WithOptional<Context, 'watching' | 'outputFileSystem'>,
  compiler: Compiler | MultiCompiler,
): void {
  function invalid() {
    context.state = false;
    context.stats = undefined;
  }

  function done(stats: Stats | MultiStats) {
    context.state = true;
    context.stats = stats;

    process.nextTick(() => {
      const { state, callbacks } = context;

      if (!state) {
        return;
      }

      context.callbacks = [];

      callbacks.forEach((callback) => {
        (callback as (...args: any[]) => Stats | MultiStats)(stats);
      });
    });
  }

  compiler.hooks.watchRun.tap('rsbuild-dev-middleware', invalid);
  compiler.hooks.invalid.tap('rsbuild-dev-middleware', invalid);
  compiler.hooks.done.tap('rsbuild-dev-middleware', done);
}
