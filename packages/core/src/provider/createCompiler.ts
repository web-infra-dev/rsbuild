import { sep } from 'node:path';
import { color, prettyTime } from '../helpers';
import { formatStats, getRsbuildStats } from '../helpers/stats';
import { isSatisfyRspackVersion, rspackMinVersion } from '../helpers/version';
import { registerDevHook } from '../hooks';
import { logger } from '../logger';
import { rspack } from '../rspack';
import type { InternalContext, RsbuildStatsItem, Rspack } from '../types';
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
  if (files.length === 0 && paths.length > 0) {
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

function printBuildLog(
  compiler: Rspack.Compiler,
  context: InternalContext,
  lazyModules: Set<string>,
) {
  const { modifiedFiles } = compiler;
  const changedFiles = modifiedFiles?.size
    ? Array.from(modifiedFiles)
    : lazyModules.size
      ? Array.from(lazyModules)
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
  logger.debug('creating compiler');

  const HOOK_NAME = 'rsbuild:compiler';
  const { context } = options;
  const { rspackConfigs } = await initConfigs(options);

  await context.hooks.onBeforeCreateCompiler.callBatch({
    bundlerConfigs: rspackConfigs,
    environments: context.environments,
  });

  if (!isSatisfyRspackVersion(rspack.rspackVersion)) {
    throw new Error(
      `${color.dim('[rsbuild]')} The current Rspack version does not meet the requirements, the minimum supported version of Rspack is ${color.green(
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
      logger.debug(`using Rspack v${rspack.rspackVersion}`);
      isVersionLogged = true;
    }
  };

  const lazyModules: Set<string> = new Set();

  // Collect lazy compiled modules from the infrastructure logs
  compiler.hooks.infrastructureLog.tap(HOOK_NAME, (name, _, args) => {
    const log = args[0];
    if (
      name === 'LazyCompilation' &&
      typeof log === 'string' &&
      log.startsWith('lazy-compilation-proxy')
    ) {
      const resource = log.split(' ')[0];
      if (!resource) {
        return;
      }

      const { rootPath } = context;
      const absolutePath = resource.split('!').pop();

      if (absolutePath?.startsWith(rootPath)) {
        const relativePath = absolutePath.replace(rootPath, '');
        lazyModules.add(relativePath);
      }
    }
  });

  compiler.hooks.run.tap(HOOK_NAME, () => {
    context.buildState.status = 'building';
  });

  compiler.hooks.watchRun.tap(HOOK_NAME, (compiler) => {
    context.buildState.status = 'building';
    logRspackVersion();

    if (!isCompiling) {
      printBuildLog(compiler, context, lazyModules);
    }

    if (lazyModules.size) {
      lazyModules.clear();
    }

    isCompiling = true;
  });

  compiler.hooks.invalid.tap(HOOK_NAME, () => {
    context.buildState.stats = null;
    context.buildState.status = 'idle';
    context.buildState.hasErrors = false;
  });

  if (context.action === 'build') {
    // When there are multiple compilers, we only need to print the start log once
    const firstCompiler = isMultiCompiler
      ? (compiler as Rspack.MultiCompiler).compilers[0]
      : compiler;

    firstCompiler.hooks.run.tap(HOOK_NAME, () => {
      logger.info('build started...');
      logRspackVersion();
    });
  }

  compiler.hooks.done.tap(
    HOOK_NAME,
    (statsInstance: Rspack.Stats | Rspack.MultiStats) => {
      const stats = getRsbuildStats(statsInstance, compiler, context.action);
      const hasErrors = statsInstance.hasErrors();

      context.buildState.stats = stats;
      context.buildState.status = 'done';
      context.buildState.hasErrors = hasErrors;

      const printTime = (statsItem: RsbuildStatsItem, index: number) => {
        if (statsItem.time) {
          const time = prettyTime(statsItem.time / 1000);
          const { name } = rspackConfigs[index];

          // When using multi compiler, print name to distinguish different compilers
          const suffix = name && isMultiCompiler ? color.dim(` (${name})`) : '';
          logger.ready(`built in ${time}${suffix}`);
        }
      };

      if (!hasErrors) {
        // only print children compiler time when multi compiler
        if (isMultiCompiler && stats.children?.length) {
          stats.children.forEach((c, index) => {
            printTime(c, index);
          });
        } else {
          printTime(stats, 0);
        }
      }

      const { message, level } = formatStats(stats, hasErrors);

      if (level === 'error') {
        logger.error(message);
      }
      if (level === 'warning') {
        logger.warn(message);
      }

      isCompiling = false;
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
  logger.debug('compiler created');

  return {
    compiler,
    rspackConfigs,
  };
}
