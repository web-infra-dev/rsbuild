import { sep } from 'node:path';
import type { StatsCompilation } from '@rspack/core';
import { rspack } from '@rspack/core';
import {
  color,
  formatStats,
  getStatsOptions,
  isSatisfyRspackVersion,
  prettyTime,
  rspackMinVersion,
} from '../helpers';
import { registerDevHook } from '../hooks';
import { logger } from '../logger';
import type { DevConfig, Rspack, ServerConfig } from '../types';
import { type InitConfigsOptions, initConfigs } from './initConfigs';

function cutPath(filePath: string, root: string) {
  const prefix = root.endsWith(sep) ? root : root + sep;
  if (filePath.startsWith(prefix)) {
    return filePath.slice(prefix.length);
  }

  const parts = filePath.split(sep).filter(Boolean);
  return parts.length > 3 ? parts.slice(-3).join(sep) : parts.join(sep);
}

export async function createCompiler(options: InitConfigsOptions): Promise<{
  compiler: Rspack.Compiler | Rspack.MultiCompiler;
  rspackConfigs: Rspack.Configuration[];
}> {
  logger.debug('create compiler');
  const { context } = options;
  const { rspackConfigs } = await initConfigs(options);

  await context.hooks.onBeforeCreateCompiler.callBatch({
    bundlerConfigs: rspackConfigs,
    environments: context.environments,
  });

  if (!(await isSatisfyRspackVersion(rspack.rspackVersion))) {
    throw new Error(
      `[rsbuild] The current Rspack version does not meet the requirements, the minimum supported version of Rspack is ${color.green(
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
      logger.debug(`use Rspack v${rspack.rspackVersion}`);
      isVersionLogged = true;
    }
  };

  compiler.hooks.watchRun.tap('rsbuild:compiling', (compiler) => {
    logRspackVersion();
    if (!isCompiling) {
      const changedFiles = compiler.modifiedFiles
        ? Array.from(compiler.modifiedFiles)
        : [];
      const removedFiles = compiler.removedFiles
        ? Array.from(compiler.removedFiles)
        : [];

      if (changedFiles.length) {
        const fileInfo = color.dim(
          changedFiles
            .map((file) => cutPath(file, context.rootPath))
            .join(', '),
        );
        logger.start(`building ${fileInfo}`);
      } else if (removedFiles.length) {
        const fileInfo = removedFiles
          .map((file) => cutPath(file, context.rootPath))
          .join(', ');
        logger.start(`building ${color.dim(`removed ${fileInfo}`)}`);
      } else {
        logger.start('build started...');
      }
    }
    isCompiling = true;
  });

  if (context.command === 'build') {
    compiler.hooks.run.tap('rsbuild:run', logRspackVersion);
  }

  const done = (stats: Rspack.Stats | Rspack.MultiStats) => {
    const statsOptions = getStatsOptions(compiler);
    const statsJson = stats.toJson({
      children: true,
      moduleTrace: true,
      // get the compilation time
      timings: true,
      preset: 'errors-warnings',
      ...statsOptions,
    });

    const printTime = (c: StatsCompilation, index: number) => {
      if (c.time) {
        const time = prettyTime(c.time / 1000);
        const { name } = rspackConfigs[index];
        const suffix = name ? color.gray(` (${name})`) : '';
        logger.ready(`built in ${time}${suffix}`);
      }
    };

    const hasErrors = stats.hasErrors();

    if (!hasErrors) {
      // only print children compiler time when multi compiler
      if (rspackConfigs.length > 1 && statsJson.children?.length) {
        statsJson.children.forEach((c, index) => {
          printTime(c, index);
        });
      } else {
        printTime(statsJson, 0);
      }
    }

    const { message, level } = formatStats(statsJson, hasErrors);

    if (level === 'error') {
      logger.error(message);
    }
    if (level === 'warning') {
      logger.warn(message);
    }

    isCompiling = false;
  };

  compiler.hooks.done.tap(
    'rsbuild:done',
    (stats: Rspack.Stats | Rspack.MultiStats) => {
      done(stats);
    },
  );

  if (context.command === 'dev') {
    registerDevHook({
      context,
      compiler,
      bundlerConfigs: rspackConfigs,
      MultiStatsCtor: rspack.MultiStats,
    });
  }

  await context.hooks.onAfterCreateCompiler.callBatch({
    compiler,
    environments: context.environments,
  });
  logger.debug('create compiler done');

  return {
    compiler,
    rspackConfigs,
  };
}

export type MiddlewareCallbacks = {
  onInvalid: () => void;
  onDone: (stats: any) => void;
};

export type DevMiddlewareOptions = {
  /** To ensure HMR works, the devMiddleware need inject the HMR client path into page when HMR enable. */
  clientPaths?: string[];
  clientConfig: DevConfig['client'];
  publicPath?: string;

  /** When liveReload is disabled, the page does not reload. */
  liveReload?: boolean;

  etag?: 'weak' | 'strong';

  /** The options need by compiler middleware (like webpackMiddleware) */
  headers?: Record<string, string | string[]>;
  writeToDisk?:
    | boolean
    | ((filename: string, compilationName?: string) => boolean);
  stats?: boolean;

  /** should trigger when compiler hook called */
  callbacks: MiddlewareCallbacks;

  /** whether use Server Side Render */
  serverSideRender?: boolean;

  serverConfig: ServerConfig;
};
