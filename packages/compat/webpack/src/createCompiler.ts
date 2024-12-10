import { type Rspack, logger } from '@rsbuild/core';
import WebpackMultiStats from 'webpack/lib/MultiStats.js';
import { type InitConfigsOptions, initConfigs } from './initConfigs.js';

export async function createCompiler(options: InitConfigsOptions) {
  logger.debug('create compiler');
  const { helpers, context } = options;
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
    const statsOptions = helpers.getStatsOptions(compiler);
    const statsJson = stats.toJson({
      moduleTrace: true,
      children: true,
      preset: 'errors-warnings',
      ...statsOptions,
    });

    const { message, level } = helpers.formatStats(
      statsJson,
      stats.hasErrors(),
    );

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

  if (context.command === 'dev') {
    helpers.registerDevHook({
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
