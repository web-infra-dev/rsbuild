import { type Rspack, logger } from '@rsbuild/core';
import WebpackMultiStats from 'webpack/lib/MultiStats.js';
import { type InitConfigsOptions, initConfigs } from './initConfigs';
import { formatStats, getStatsOptions, registerDevHook } from './shared';

export async function createCompiler(options: InitConfigsOptions) {
  logger.debug('create compiler');
  const { context } = options;
  const { webpackConfigs } = await initConfigs(options);

  await context.hooks.onBeforeCreateCompiler.call({
    bundlerConfigs: webpackConfigs as Rspack.Configuration[],
    environments: context.environments,
  });

  const { default: webpack } = await import('webpack');

  const compiler = (webpackConfigs.length === 1
    ? webpack(webpackConfigs[0])
    : webpack(webpackConfigs)) as unknown as
    | Rspack.Compiler
    | Rspack.MultiCompiler;

  const done = (stats: Rspack.Stats) => {
    const statsOptions = getStatsOptions(compiler);
    const statsJson = stats.toJson({
      children: true,
      ...(typeof statsOptions === 'string'
        ? { preset: statsOptions }
        : { preset: 'errors-warnings' }),
      ...(typeof statsOptions === 'object' ? statsOptions : {}),
    });

    const { message, level } = formatStats(statsJson, stats.hasErrors());

    if (level === 'error') {
      logger.error(message);
    }
    if (level === 'warning') {
      logger.warn(message);
    }
  };

  compiler.hooks.done.tap('rsbuild:done', (stats: unknown) => {
    done(stats as Rspack.Stats);
  });

  if (context.normalizedConfig?.mode === 'development') {
    registerDevHook({
      compiler,
      context,
      bundlerConfigs: webpackConfigs as Rspack.Configuration[],
      MultiStatsCtor: WebpackMultiStats,
    });
  }

  await context.hooks.onAfterCreateCompiler.call({
    compiler,
    environments: context.environments,
  });
  logger.debug('create compiler done');

  return {
    compiler,
    webpackConfigs,
  };
}
