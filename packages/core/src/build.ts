import { rspack, type WatchOptions } from '@rspack/core';
import { createCompiler } from './createCompiler';
import { registerBuildHook } from './hooks';
import type { InitConfigsOptions } from './initConfigs';
import { watchFilesForRestart } from './restart';
import type { Build, BuildOptions, Rspack } from './types';

export const RSPACK_BUILD_ERROR = 'Rspack build failed.';

export const build = async (
  initOptions: InitConfigsOptions,
  buildOptions: BuildOptions = {},
): Promise<ReturnType<Build>> => {
  const { watch } = buildOptions;
  const { context } = initOptions;
  const { logger } = context;
  const { compiler, rspackConfigs } = await createCompiler(initOptions);

  registerBuildHook({
    context,
    rspackConfigs,
    compiler,
    isWatch: Boolean(watch),
    MultiStatsCtor: rspack.MultiStats,
  });

  let stats: Rspack.Stats | Rspack.MultiStats | undefined;
  let closeCompiler: (() => Promise<void>) | undefined;

  if (watch) {
    const watchOptions: WatchOptions[] = rspackConfigs.map((options) => options.watchOptions || {});

    compiler.watch(watchOptions.length > 1 ? watchOptions : watchOptions[0] || {}, (err) => {
      if (err) {
        logger.error(err);
      }
    });

    closeCompiler = () =>
      new Promise((resolve) => {
        compiler.close(() => {
          resolve();
        });
      });
  } else {
    stats = await new Promise<Rspack.Stats | Rspack.MultiStats | undefined>((resolve, reject) => {
      compiler.run((err, stats) => {
        // When using run or watch, call close and wait for it to finish before calling run or watch again.
        // Concurrent compilations will corrupt the output files.
        compiler.close((closeErr) => {
          if (closeErr) {
            logger.error('Failed to close compiler: ', closeErr);
          }

          if (err) {
            reject(err);
          } else if (context.buildState.hasErrors) {
            reject(new Error(RSPACK_BUILD_ERROR));
          } else {
            resolve(stats);
          }
        });
      });
    });
  }

  let closingPromise: Promise<void> | undefined;
  let unregisterRestart: (() => void) | undefined;

  // Keep the restart watcher active when closing build resources,
  // so failed restarts can be retried.
  const closeBuild = () => {
    closingPromise ||= (async () => {
      unregisterRestart?.();
      unregisterRestart = undefined;
      await context.hooks.onCloseBuild.callBatch();
      await closeCompiler?.();
    })();
    return closingPromise;
  };

  let restartWatcher: ReturnType<typeof watchFilesForRestart>;
  if (watch) {
    unregisterRestart = context.restartManager.registerCleanup(closeBuild);
    restartWatcher = watchFilesForRestart({
      watchFiles: context.normalizedConfig!.dev.watchFiles,
      context,
      restartContext: {
        action: 'build',
        options: buildOptions,
      },
    });
  }

  // Fully close the build and its restart watcher.
  const close = async () => {
    await restartWatcher?.close();
    await closeBuild();
  };

  return {
    stats,
    close,
  };
};
