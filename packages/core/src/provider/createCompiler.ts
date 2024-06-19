import {
  type MultiStats,
  type Rspack,
  type RspackConfig,
  type Stats,
  color,
} from '@rsbuild/shared';
import { rspack } from '@rspack/core';
import type { StatsCompilation } from '@rspack/core';
import { TARGET_ID_MAP } from '../constants';
import {
  formatStats,
  getStatsOptions,
  isDev,
  isProd,
  isSatisfyRspackVersion,
  onCompileDone,
  prettyTime,
  rspackMinVersion,
} from '../helpers';
import { logger } from '../logger';
import type { DevMiddlewareAPI } from '../server/devMiddleware';
import type { DevConfig, InternalContext } from '../types';
import { type InitConfigsOptions, initConfigs } from './initConfigs';

export async function createCompiler({
  context,
  rspackConfigs,
}: {
  context: InternalContext;
  rspackConfigs: RspackConfig[];
}): Promise<Rspack.Compiler | Rspack.MultiCompiler> {
  logger.debug('create compiler');
  await context.hooks.onBeforeCreateCompiler.call({
    bundlerConfigs: rspackConfigs,
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

  const done = async (stats: Stats | MultiStats) => {
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

    const { message, level } = formatStats(stats, getStatsOptions(compiler));

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
  };

  onCompileDone(
    compiler,
    done,
    // @ts-expect-error type mismatch
    rspack.MultiStats,
  );

  await context.hooks.onAfterCreateCompiler.call({ compiler });
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
