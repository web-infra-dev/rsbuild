import { rspack } from '@rspack/core';
import { registerBuildHook } from '../hooks';
import { logger } from '../logger';
import type { Build, BuildOptions, Rspack } from '../types';
import { createCompiler } from './createCompiler';
import type { InitConfigsOptions } from './initConfigs';

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
    compiler.watch({}, (err) => {
      if (err) {
        logger.error(err);
      }
    });

    return {
      close: () =>
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
      if (err) {
        reject(err);
      } else if (stats?.hasErrors()) {
        reject(new Error('Rspack build failed!'));
      }
      // If there is a compilation error, the close method should not be called.
      // Otherwise the bundler may generate an invalid cache.
      else {
        // When using run or watch, call close and wait for it to finish before calling run or watch again.
        // Concurrent compilations will corrupt the output files.
        compiler.close((closeErr) => {
          if (closeErr) {
            logger.error(closeErr);
          }

          resolve({ stats });
        });
      }
    });
  });

  return {
    stats,
    close: async () => {},
  };
};
