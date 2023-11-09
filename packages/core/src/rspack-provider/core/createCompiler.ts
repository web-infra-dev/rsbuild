import {
  isDev,
  debug,
  logger,
  prettyTime,
  formatStats,
  TARGET_ID_MAP,
  type RspackConfig,
} from '@rsbuild/shared';
import { type RspackCompiler, type RspackMultiCompiler } from '@rsbuild/shared';
import { getDevMiddleware } from './devMiddleware';
import { initConfigs, type InitConfigsOptions } from './initConfigs';

import type { Context } from '../types';

export async function createCompiler({
  context,
  rspackConfigs,
}: {
  context: Context;
  rspackConfigs: RspackConfig[];
}) {
  debug('create compiler');
  await context.hooks.onBeforeCreateCompilerHook.call({
    bundlerConfigs: rspackConfigs,
  });

  const { rspack } = await import('@rspack/core');

  const compiler = rspack(rspackConfigs);

  let isFirstCompile = true;

  compiler.hooks.watchRun.tap('rsbuild:compiling', () => {
    logger.start('Compiling...');
  });

  compiler.hooks.done.tap('rsbuild:done', async (stats) => {
    const obj = stats.toJson({
      all: false,
      timings: true,
    });

    if (!stats.hasErrors() && obj.children) {
      obj.children.forEach((c, index) => {
        if (c.time) {
          const time = prettyTime(c.time / 1000);
          const target = Array.isArray(context.target)
            ? context.target[index]
            : context.target;
          const name = TARGET_ID_MAP[target || 'web'];
          logger.ready(`${name} compiled in ${time}`);
        }
      });
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

export async function startDevCompile(
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
