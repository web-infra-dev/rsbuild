import { logger } from '@rsbuild/core';
import type { Build, BuildOptions, Rspack } from '@rsbuild/core';
import type { Configuration as WebpackConfig } from 'webpack';
import WebpackMultiStats from 'webpack/lib/MultiStats.js';
import { createCompiler } from './createCompiler';
import type { InitConfigsOptions } from './initConfigs';
import { registerBuildHook } from './shared';

export const build = async (
  initOptions: InitConfigsOptions,
  { watch, compiler: customCompiler }: BuildOptions = {},
): Promise<ReturnType<Build>> => {
  const { context } = initOptions;

  let compiler: Rspack.Compiler | Rspack.MultiCompiler;
  let bundlerConfigs: WebpackConfig[] | undefined;

  if (customCompiler) {
    compiler = customCompiler;
  } else {
    const result = await createCompiler(initOptions);
    compiler = result.compiler;
    bundlerConfigs = result.webpackConfigs;
  }

  registerBuildHook({
    context,
    bundlerConfigs: bundlerConfigs as Rspack.Configuration[],
    compiler,
    isWatch: Boolean(watch),
    MultiStatsCtor: WebpackMultiStats,
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
          watching.close(() => {
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
      // Otherwise bundler may generate an invalid cache.
      else {
        // When using run or watch, call close and wait for it to finish before calling run or watch again.
        // Concurrent compilations will corrupt the output files.
        compiler.close((closeErr) => {
          closeErr && logger.error(closeErr);

          resolve({ stats });
        });
      }
    });
  });

  return {
    stats,
    // This close method is a noop in non-watch mode
    // In watch mode, it's defined above to stop watching
    close: async () => {},
  };
};
