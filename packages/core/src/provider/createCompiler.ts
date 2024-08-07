import { rspack } from '@rspack/core';
import type { StatsCompilation } from '@rspack/core';
import color from 'picocolors';
import {
  formatStats,
  getStatsOptions,
  isDev,
  isProd,
  isSatisfyRspackVersion,
  prettyTime,
  rspackMinVersion,
} from '../helpers';
import { registerDevHook } from '../hooks';
import { logger } from '../logger';
import type { DevMiddlewareAPI } from '../server/devMiddleware';
import type {
  DevConfig,
  InternalContext,
  MultiStats,
  Rspack,
  Stats,
} from '../types';
import { type InitConfigsOptions, initConfigs } from './initConfigs';

export async function createCompiler({
  context,
  rspackConfigs,
}: {
  context: InternalContext;
  rspackConfigs: Rspack.Configuration[];
}): Promise<Rspack.Compiler | Rspack.MultiCompiler> {
  logger.debug('create compiler');
  await context.hooks.onBeforeCreateCompiler.call({
    bundlerConfigs: rspackConfigs,
    environments: context.environments,
  });

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

  const done = (stats: Stats | MultiStats) => {
    const statsJson = stats.toJson({
      all: false,
      timings: true,
    });

    const printTime = (c: StatsCompilation, index: number) => {
      if (c.time) {
        const time = prettyTime(c.time / 1000);
        const { name } = rspackConfigs[index];
        const suffix = name ? color.gray(` (${name})`) : '';
        logger.ready(`Compiled in ${time}${suffix}`);
      }
    };

    if (!stats.hasErrors()) {
      if (statsJson.children) {
        statsJson.children.forEach((c, index) => {
          printTime(c, index);
        });
      } else {
        printTime(statsJson, 0);
      }
    }

    const { message, level } = formatStats(stats, getStatsOptions(compiler));

    if (level === 'error') {
      logger.error(message);
    }
    if (level === 'warning') {
      logger.warn(message);
    }

    isCompiling = false;
  };

  compiler.hooks.done.tap('rsbuild:done', (stats: Stats | MultiStats) => {
    done(stats);
  });

  if (isDev()) {
    registerDevHook({
      context,
      compiler,
      bundlerConfigs: rspackConfigs,
      MultiStatsCtor: rspack.MultiStats,
    });
  }

  await context.hooks.onAfterCreateCompiler.call({
    compiler,
    environments: context.environments,
  });
  logger.debug('create compiler done');

  return compiler;
}

export type MiddlewareCallbacks = {
  onInvalid: () => void;
  onDone: (stats: any) => void;
};

export type DevMiddlewareOptions = {
  /** To ensure HMR works, the devMiddleware need inject the hmr client path into page when HMR enable. */
  clientPaths?: string[];
  clientConfig: DevConfig['client'];
  publicPath?: string;

  /** When liveReload is disabled, the page does not reload. */
  liveReload?: boolean;

  etag?: 'weak' | 'strong';

  /** The options need by compiler middleware (like webpackMiddleware) */
  headers?: Record<string, string | string[]>;
  writeToDisk?: boolean | ((filename: string) => boolean);
  stats?: boolean;

  /** should trigger when compiler hook called */
  callbacks: MiddlewareCallbacks;

  /** whether use Server Side Render */
  serverSideRender?: boolean;
};

export type CreateDevMiddlewareReturns = {
  devMiddleware: (options: DevMiddlewareOptions) => DevMiddlewareAPI;
  compiler: Rspack.Compiler | Rspack.MultiCompiler;
};

export async function createDevMiddleware(
  options: InitConfigsOptions,
  customCompiler?: Rspack.Compiler | Rspack.MultiCompiler,
): Promise<CreateDevMiddlewareReturns> {
  let compiler: Rspack.Compiler | Rspack.MultiCompiler;
  if (customCompiler) {
    compiler = customCompiler;
  } else {
    const { rspackConfigs } = await initConfigs(options);
    compiler = await createCompiler({
      context: options.context,
      rspackConfigs,
    });
  }

  const { getDevMiddleware } = await import('../server/devMiddleware');
  return {
    devMiddleware: await getDevMiddleware(compiler),
    compiler,
  };
}
