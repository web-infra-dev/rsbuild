import { type EnvironmentContext, type Rspack, logger } from '@rsbuild/core';
import WebpackMultiStats from 'webpack/lib/MultiStats.js';
import { type InitConfigsOptions, initConfigs } from './initConfigs';
import {
  type InternalContext,
  formatStats,
  getDevMiddleware,
  getStatsOptions,
} from './shared';
import { onCompileDone } from './shared';
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

  let isFirstCompile = true;

  const done = async (stats: unknown) => {
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

    if (process.env.NODE_ENV === 'development') {
      await context.hooks.onDevCompileDone.call({
        isFirstCompile,
        stats: stats as Rspack.Stats,
        environments: context.environments,
      });
    }

    isFirstCompile = false;
  };

  const environmentArr = Object.values(context.environments).reduce<
    EnvironmentContext[]
  >((prev, curr) => {
    prev[curr.index] = curr;
    return prev;
  }, []);

  const onEnvironmentDone = async (index: number, stats: Rspack.Stats) => {
    if (process.env.NODE_ENV === 'development') {
      await context.hooks.onDevCompileEnvironmentDone.callInEnvironment({
        environment: environmentArr[index].name,
        args: [
          {
            isFirstCompile,
            stats,
            environment: environmentArr[index],
          },
        ],
      });
    }
  };

  onCompileDone({
    compiler,
    onDone: done,
    onEnvironmentDone,
    MultiStatsCtor: WebpackMultiStats,
  });

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
