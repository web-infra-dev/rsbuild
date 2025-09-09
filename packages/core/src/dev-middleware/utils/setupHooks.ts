import type { MultiStats as WMultiStats, Stats as WStats } from '@rspack/core';
import type { Context, WithOptional } from '../index';

export function setupHooks(
  context: WithOptional<Context, 'watching' | 'outputFileSystem'>,
): void {
  function invalid() {
    context.state = false;
    context.stats = undefined;
  }

  function done(stats: WStats | WMultiStats) {
    context.state = true;
    context.stats = stats;

    process.nextTick(() => {
      const { state, callbacks } = context as Context;

      if (!state) {
        return;
      }

      (context as Context).callbacks = [];

      callbacks.forEach((callback) => {
        (callback as (...args: any[]) => WStats | WMultiStats)(stats);
      });
    });
  }

  const compiler = (context as Context).compiler;

  compiler.hooks.watchRun.tap('rsbuild-dev-middleware', invalid);
  compiler.hooks.invalid.tap('rsbuild-dev-middleware', invalid);
  compiler.hooks.done.tap('rsbuild-dev-middleware', done);
}
