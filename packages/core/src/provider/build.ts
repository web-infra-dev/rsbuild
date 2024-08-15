import { rspack } from '@rspack/core';
import { registerBuildHook } from '../hooks';
import { logger } from '../logger';
import type { BuildOptions, MultiStats, Rspack, Stats } from '../types';
import { createCompiler } from './createCompiler';
import { type InitConfigsOptions, initConfigs } from './initConfigs';

export const build = async (
  initOptions: InitConfigsOptions,
  { watch, compiler: customCompiler }: BuildOptions = {},
): Promise<void | {
  close: () => Promise<void>;
}> => {
  const { context } = initOptions;

  let compiler: Rspack.Compiler | Rspack.MultiCompiler;
  let bundlerConfigs: Rspack.Configuration[] | undefined;

  if (customCompiler) {
    compiler = customCompiler as any;
  } else {
    const { rspackConfigs } = await initConfigs(initOptions);
    compiler = await createCompiler({
      context,
      rspackConfigs,
    });
    bundlerConfigs = rspackConfigs;
  }

  registerBuildHook({
    context,
    bundlerConfigs,
    compiler,
    isWatch: Boolean(watch),
    MultiStatsCtor: rspack.MultiStats,
  });

  if (watch) {
    const watching = compiler.watch({}, (err) => {
      if (err) {
        logger.error(err);
      }
    });
    return {
      close: () =>
        new Promise((resolve) => {
          watching.close(resolve);
        }),
    };
  }

  await new Promise<{ stats?: Stats | MultiStats }>((resolve, reject) => {
    compiler.run((err, stats?: Stats | MultiStats) => {
      if (err || stats?.hasErrors()) {
        const buildError = err || new Error('Rspack build failed!');
        reject(buildError);
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

          // Assert type of stats must align to compiler.
          resolve({ stats });
        });
      }
    });
  });
};
