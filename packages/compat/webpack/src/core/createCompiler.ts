import { isDev, logger, debug, formatStats, type Stats } from '@rsbuild/shared';
import type { Context, WebpackConfig } from '../types';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import type { Compiler, MultiCompiler } from 'webpack';
import { getDevMiddleware } from './devMiddleware';

export async function createCompiler({
  context,
  webpackConfigs,
}: {
  context: Context;
  webpackConfigs: WebpackConfig[];
}) {
  debug('create compiler');
  await context.hooks.onBeforeCreateCompilerHook.call({
    bundlerConfigs: webpackConfigs,
  });

  const { default: webpack } = await import('webpack');

  const compiler =
    webpackConfigs.length === 1
      ? webpack(webpackConfigs[0])
      : webpack(webpackConfigs);

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
      await context.hooks.onDevCompileDoneHook.call({
        isFirstCompile,
      });
    }

    isFirstCompile = false;
  });

  await context.hooks.onAfterCreateCompilerHook.call({ compiler });
  debug('create compiler done');

  return compiler;
}

export async function createDevMiddleware(
  options: InitConfigsOptions,
  customCompiler?: Compiler | MultiCompiler,
) {
  let compiler: Compiler | MultiCompiler;
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
