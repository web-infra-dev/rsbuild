import { logger, type Rspack } from '@rsbuild/core';
import WebpackMultiStats from 'webpack/lib/MultiStats.js';
import { type InitConfigsOptions, initConfigs } from './initConfigs.js';

export async function createCompiler(options: InitConfigsOptions) {
  logger.debug('creating compiler');

  const HOOK_NAME = 'rsbuild:compiler';
  const { helpers, context } = options;
  const { webpackConfigs } = await initConfigs(options);

  await context.hooks.onBeforeCreateCompiler.callBatch({
    bundlerConfigs: webpackConfigs as Rspack.Configuration[],
    environments: context.environments,
  });

  const { default: webpack } = await import('webpack');

  const compiler = (webpackConfigs.length === 1
    ? webpack(webpackConfigs[0])
    : webpack(webpackConfigs)) as unknown as
    | Rspack.Compiler
    | Rspack.MultiCompiler;

  compiler.hooks.run.tap(HOOK_NAME, () => {
    context.buildState.status = 'building';
  });

  compiler.hooks.watchRun.tap(HOOK_NAME, () => {
    context.buildState.status = 'building';
  });

  compiler.hooks.invalid.tap(HOOK_NAME, () => {
    context.buildState.stats = null;
    context.buildState.status = 'idle';
    context.buildState.hasErrors = false;
  });

  compiler.hooks.done.tap(HOOK_NAME, (statsInstance) => {
    const stats = helpers.getRsbuildStats(
      statsInstance,
      compiler,
      context.action,
    );
    const hasErrors = helpers.getStatsErrors(stats).length > 0;

    context.buildState.stats = stats;
    context.buildState.status = 'done';
    context.buildState.hasErrors = hasErrors;

    const { message, level } = helpers.formatStats(stats, hasErrors);

    if (level === 'error') {
      logger.error(message);
    } else if (level === 'warning') {
      logger.warn(message);
    }
  });

  if (context.action === 'dev') {
    helpers.registerDevHook({
      compiler,
      context,
      bundlerConfigs: webpackConfigs as Rspack.Configuration[],
      MultiStatsCtor: WebpackMultiStats,
    });
  }

  await context.hooks.onAfterCreateCompiler.callBatch({
    compiler,
    environments: context.environments,
  });
  logger.debug('compiler created');

  return {
    compiler,
    webpackConfigs,
  };
}
