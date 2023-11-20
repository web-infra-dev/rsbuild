import {
  isDev,
  debug,
  logger,
  prettyTime,
  formatStats,
  TARGET_ID_MAP,
  type RspackConfig,
  type RspackCompiler,
  type RspackMultiCompiler,
} from '@rsbuild/shared';
import { getDevMiddleware } from './devMiddleware';
import { initConfigs, type InitConfigsOptions } from './initConfigs';

import type { Context } from '../../types';
import { Stats, MultiStats, StatsCompilation } from '@rspack/core';

export async function createCompiler({
  context,
  rspackConfigs,
}: {
  context: Context;
  rspackConfigs: RspackConfig[];
}): Promise<RspackCompiler | RspackMultiCompiler> {
  debug('create compiler');
  await context.hooks.onBeforeCreateCompilerHook.call({
    bundlerConfigs: rspackConfigs,
  });

  const { rspack } = await import('@rspack/core');

  const compiler =
    rspackConfigs.length === 1
      ? rspack(rspackConfigs[0])
      : rspack(rspackConfigs);

  let isFirstCompile = true;

  compiler.hooks.watchRun.tap('rsbuild:compiling', () => {
    logger.start('Compiling...');
  });

  compiler.hooks.done.tap('rsbuild:done', async (stats: Stats | MultiStats) => {
    const obj = stats.toJson({
      all: false,
      timings: true,
    });

    const printTime = (c: StatsCompilation, index: number) => {
      if (c.time) {
        const time = prettyTime(c.time / 1000);
        const target = Array.isArray(context.target)
          ? context.target[index]
          : context.target;
        const name = TARGET_ID_MAP[target || 'web'];
        logger.ready(`${name} compiled in ${time}`);
      }
    };

    if (!stats.hasErrors()) {
      if (obj.children) {
        obj.children.forEach((c, index) => {
          printTime(c, index);
        });
      } else {
        printTime(obj, 0);
      }
    }

    const { message, level } = formatStats(stats);

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
  customCompiler?: RspackCompiler | RspackMultiCompiler,
) {
  let compiler: RspackCompiler | RspackMultiCompiler;
  if (customCompiler) {
    compiler = customCompiler;
  } else {
    const { rspackConfigs } = await initConfigs(options);
    compiler = await createCompiler({
      context: options.context,
      rspackConfigs,
    });
  }

  return getDevMiddleware(compiler);
}
