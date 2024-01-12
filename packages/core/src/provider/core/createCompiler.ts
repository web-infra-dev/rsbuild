import {
  isDev,
  isProd,
  debug,
  color,
  logger,
  prettyTime,
  TARGET_ID_MAP,
  type RspackConfig,
  type RspackCompiler,
  type RspackMultiCompiler,
  type CreateDevMiddlewareReturns,
} from '@rsbuild/shared';
import { initConfigs, type InitConfigsOptions } from './initConfigs';
import type { InternalContext } from '../../types';
import type { Stats, MultiStats, StatsCompilation } from '@rspack/core';
import {
  formatStats,
  rspackMinVersion,
  isSatisfyRspackVersion,
} from '../shared';

export async function createCompiler({
  context,
  rspackConfigs,
}: {
  context: InternalContext;
  rspackConfigs: RspackConfig[];
}): Promise<RspackCompiler | RspackMultiCompiler> {
  debug('create compiler');
  await context.hooks.onBeforeCreateCompiler.call({
    bundlerConfigs: rspackConfigs,
  });

  const { rspack } = await import('@rspack/core');

  if (!(await isSatisfyRspackVersion(rspack.rspackVersion))) {
    throw new Error(
      `The current Rspack version does not meet the requirements, the minimum supported version of Rspack is ${color.green(
        rspackMinVersion,
      )}`,
    );
  }

  const compiler =
    rspackConfigs.length === 1
      ? rspack(rspackConfigs[0])
      : rspack(rspackConfigs);

  let isFirstCompile = true;
  let isVersionLogged = false;
  let isCompiling = false;

  const logRspackVersion = () => {
    if (!isVersionLogged) {
      logger.debug(`Use Rspack v${rspack.rspackVersion}`);
      isVersionLogged = true;
    }
  };

  compiler.hooks.watchRun.tap('rsbuild:compiling', () => {
    logRspackVersion();
    if (!isCompiling) {
      logger.start('Compiling...');
    }
    isCompiling = true;
  });

  if (isProd()) {
    compiler.hooks.run.tap('rsbuild:run', logRspackVersion);
  }

  compiler.hooks.done.tap('rsbuild:done', async (stats: Stats | MultiStats) => {
    const obj = stats.toJson({
      all: false,
      timings: true,
    });

    const printTime = (c: StatsCompilation, index: number) => {
      if (c.time) {
        const time = prettyTime(c.time / 1000);
        const target = context.targets[index];
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
      await context.hooks.onDevCompileDone.call({
        isFirstCompile,
        stats: stats,
      });
    }

    isCompiling = false;
    isFirstCompile = false;
  });

  await context.hooks.onAfterCreateCompiler.call({ compiler });
  debug('create compiler done');

  return compiler;
}

export async function createDevMiddleware(
  options: InitConfigsOptions,
  customCompiler?: RspackCompiler | RspackMultiCompiler,
): Promise<CreateDevMiddlewareReturns> {
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

  const { getDevMiddleware } = await import('./devMiddleware');
  return {
    devMiddleware: getDevMiddleware(compiler),
    compiler,
  };
}
