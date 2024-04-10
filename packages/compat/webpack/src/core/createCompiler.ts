import {
  debug,
  isDev,
  logger,
  onCompileDone,
  type Stats,
  type Rspack,
  type RspackConfig,
} from '@rsbuild/shared';
import {
  formatStats,
  getStatsOptions,
  getDevMiddleware,
  type InternalContext,
} from '@rsbuild/core/internal';
import type { WebpackConfig } from '../types';
import { initConfigs, type InitConfigsOptions } from './initConfigs';
// @ts-expect-error
import WebpackMultiStats from 'webpack/lib/MultiStats';

export async function createCompiler({
  context,
  webpackConfigs,
}: {
  context: InternalContext;
  webpackConfigs: WebpackConfig[];
}) {
  debug('create compiler');
  await context.hooks.onBeforeCreateCompiler.call({
    bundlerConfigs: webpackConfigs as RspackConfig[],
  });

  const { default: webpack } = await import('webpack');

  const compiler = (webpackConfigs.length === 1
    ? webpack(webpackConfigs[0])
    : webpack(webpackConfigs)) as unknown as
    | Rspack.Compiler
    | Rspack.MultiCompiler;

  const done = async (stats: unknown) => {
    const { message, level } = formatStats(
      stats as Stats,
      getStatsOptions(compiler),
    );

    if (level === 'error') {
      logger.error(message);
    }
    if (level === 'warning') {
      logger.warn(message);
    }

    if (isDev()) {
      await context.hooks.onDevCompileDone.call({
        isFirstCompile,
        stats: stats as Stats,
      });
    }

    isFirstCompile = false;
  };

  let isFirstCompile = true;

  onCompileDone(compiler, done, WebpackMultiStats);

  await context.hooks.onAfterCreateCompiler.call({
    compiler,
  });
  debug('create compiler done');

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
    devMiddleware: getDevMiddleware(compiler),
    compiler,
  };
}
