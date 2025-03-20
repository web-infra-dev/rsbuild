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
import type {
  DevConfig,
  InternalContext,
  Rspack,
  ServerConfig,
} from '../types';
import { type InitConfigsOptions, initConfigs } from './initConfigs';

// keep the last 3 parts of the path to make logs clean
function cutPath(originalFilePath: string, root: string) {
  const prefix = root.endsWith(sep) ? root : root + sep;

  let filePath = originalFilePath;
  if (filePath.startsWith(prefix)) {
    filePath = filePath.slice(prefix.length);
  }

  const parts = filePath.split(sep).filter(Boolean);
  return parts.length > 3 ? parts.slice(-3).join(sep) : parts.join(sep);
}

function isLikelyFile(filePath: string): boolean {
  const lastSegment = filePath.split(sep).pop() || '';
  return lastSegment.includes('.');
}

function formatFileList(paths: string[], rootPath: string) {
  let files = paths.filter(isLikelyFile);

  // if no files, use the first path as the file
  if (files.length === 0) {
    files = [paths[0]];
  }

  const fileInfo = files
    .slice(0, 1)
    .map((file) => cutPath(file, rootPath))
    .join(', ');

  if (files.length > 1) {
    return `${fileInfo} and ${files.length - 1} more`;
  }

  return fileInfo;
}

function printBuildLog(compiler: Rspack.Compiler, context: InternalContext) {
  const changedFiles = compiler.modifiedFiles
    ? Array.from(compiler.modifiedFiles)
    : null;
  if (changedFiles?.length) {
    const fileInfo = formatFileList(changedFiles, context.rootPath);
    logger.start(`building ${color.dim(fileInfo)}`);
    return;
  }

  const removedFiles = compiler.removedFiles
    ? Array.from(compiler.removedFiles)
    : null;
  if (removedFiles?.length) {
    const fileInfo = formatFileList(removedFiles, context.rootPath);
    logger.start(`building ${color.dim(`removed ${fileInfo}`)}`);
    return;
  }

  logger.start('build started...');
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

  const isMultiCompiler = rspackConfigs.length > 1;
  const compiler = isMultiCompiler
    ? rspack(rspackConfigs)
    : rspack(rspackConfigs[0]);

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
      printBuildLog(compiler, context);
    }
    isCompiling = true;
  });

  if (context.action === 'build') {
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

        // When using multi compiler, print name to distinguish different compilers
        const suffix = name && isMultiCompiler ? color.gray(` (${name})`) : '';
        logger.ready(`built in ${time}${suffix}`);
      }
    };

    const hasErrors = stats.hasErrors();

    if (!hasErrors) {
      // only print children compiler time when multi compiler
      if (isMultiCompiler && statsJson.children?.length) {
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

  if (context.action === 'dev') {
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
