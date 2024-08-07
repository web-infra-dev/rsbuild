import { type Rspack, logger } from '@rsbuild/core';
import WebpackMultiStats from 'webpack/lib/MultiStats.js';
import { type InitConfigsOptions, initConfigs } from './initConfigs';
import {
  type InternalContext,
  formatStats,
  getDevMiddleware,
  getStatsOptions,
  registerDevHook,
} from './shared';
import type { WebpackConfig } from './types';

export async function createCompiler({
  context,
  webpackConfigs,
}: {
  context: InternalContext;
  webpackConfigs: WebpackConfig[];
}) {
  logger.debug('create compiler');
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

  const done = (stats: unknown) => {
    const { message, level } = formatStats(
      stats as Rspack.Stats,
      getStatsOptions(compiler),
    );

    if (level === 'error') {
      logger.error(message);
    }
    if (level === 'warning') {
      logger.warn(message);
    }
  };

  compiler.hooks.done.tap('rsbuild:done', (stats: unknown) => {
    done(stats);
  });

  if (context.normalizedConfig?.mode === 'development') {
    registerDevHook({
      compiler,
      context,
      bundlerConfigs: webpackConfigs as any,
      MultiStatsCtor: WebpackMultiStats,
    });
  }

  await context.hooks.onAfterCreateCompiler.call({
    compiler,
    environments: context.environments,
  });
  logger.debug('create compiler done');

  return compiler;
}

export async function createDevMiddleware(
  options: InitConfigsOptions,
  customCompiler?: Rspack.Compiler | Rspack.MultiCompiler,
) {
  let compiler: Rspack.Compiler | Rspack.MultiCompiler;
  if (customCompiler) {
    compiler = customCompiler;
  } else {
    const { webpackConfigs } = await initConfigs(options);
    compiler = await createCompiler({
      context: options.context,
      webpackConfigs,
    });
  }

  return {
    devMiddleware: await getDevMiddleware(compiler),
    compiler,
  };
}
