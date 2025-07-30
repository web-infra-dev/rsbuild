import type { WatchOptions } from '@rspack/core';
import { registerBuildHook } from '../hooks';
import { logger } from '../logger';
import { rspack } from '../rspack';
import type { Build, BuildOptions, Rspack } from '../types';
import { createCompiler } from './createCompiler';
import type { InitConfigsOptions } from './initConfigs';

export const RSPACK_BUILD_ERROR = 'Rspack build failed.';

export const build = async (
  initOptions: InitConfigsOptions,
  { watch, compiler: customCompiler }: BuildOptions = {},
): Promise<ReturnType<Build>> => {
  const { context } = initOptions;

  let compiler: Rspack.Compiler | Rspack.MultiCompiler;
  let bundlerConfigs: Rspack.Configuration[] | undefined;

  if (customCompiler) {
    compiler = customCompiler;
  } else {
    const result = await createCompiler(initOptions);
    compiler = result.compiler;
    bundlerConfigs = result.rspackConfigs;
  }

  registerBuildHook({
    context,
    bundlerConfigs,
    compiler,
    isWatch: Boolean(watch),
    MultiStatsCtor: rspack.MultiStats,
  });

  if (watch) {
    const watchOptions: WatchOptions[] = bundlerConfigs
      ? bundlerConfigs.map((options) => options.watchOptions || {})
      : [];

    compiler.watch(
      // @ts-expect-error
      // TODO: https://github.com/web-infra-dev/rspack/pull/11174
      watchOptions.length > 1 ? watchOptions : watchOptions[0] || {},
      (err) => {
        if (err) {
          logger.error(err);
        }
      },
    );

    return {
      close: async () =>
        new Promise((resolve) => {
          compiler.close(() => {
            resolve();
          });
        }),
    };
  }

  const { stats } = await new Promise<{
    stats?: Rspack.Stats | Rspack.MultiStats;
  }>((resolve, reject) => {
    compiler.run((err, stats) => {
      // When using run or watch, call close and wait for it to finish before calling run or watch again.
      // Concurrent compilations will corrupt the output files.
      compiler.close((closeErr) => {
        if (closeErr) {
          logger.error('Failed to close compiler: ', closeErr);
        }

        if (err) {
          reject(err);
        } else if (stats?.hasErrors()) {
          reject(new Error(RSPACK_BUILD_ERROR));
        } else {
          resolve({ stats });
        }
      });
    });
  });

  return {
    stats,
    close: async () => {},
  };
};
