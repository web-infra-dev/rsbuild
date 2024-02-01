import {
  isDev,
  logger,
  debug,
  type Stats,
  type Rspack,
  type RspackConfig,
} from '@rsbuild/shared';
import { formatStats, type InternalContext } from '@rsbuild/core/provider';
import type { WebpackConfig } from '../types';
import { initConfigs, type InitConfigsOptions } from './initConfigs';
import type { Compiler } from 'webpack';
import { getDevMiddleware } from './devMiddleware';

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

  let isFirstCompile = true;

  compiler.hooks.done.tap('rsbuild:done', async (stats: unknown) => {
    const { message, level } = formatStats(stats as Stats);

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
  });

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
    devMiddleware: getDevMiddleware(compiler as unknown as Compiler),
    compiler,
  };
}
