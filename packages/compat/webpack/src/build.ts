import { logger } from '@rsbuild/core';
import type { Build, BuildOptions, Rspack } from '@rsbuild/core';
import type { Configuration as WebpackConfig } from 'webpack';
import WebpackMultiStats from 'webpack/lib/MultiStats.js';
import { createCompiler } from './createCompiler.js';
import type { InitConfigsOptions } from './initConfigs.js';

export const build = async (
  initOptions: InitConfigsOptions,
  { watch, compiler: customCompiler }: BuildOptions = {},
): Promise<ReturnType<Build>> => {
  const { helpers, context } = initOptions;

  let compiler: Rspack.Compiler | Rspack.MultiCompiler;
  let bundlerConfigs: WebpackConfig[] | undefined;

  if (customCompiler) {
    compiler = customCompiler;
  } else {
    const result = await createCompiler(initOptions);
    compiler = result.compiler;
    bundlerConfigs = result.webpackConfigs;
  }

  helpers.registerBuildHook({
    context,
    bundlerConfigs: bundlerConfigs as Rspack.Configuration[],
    compiler,
    isWatch: Boolean(watch),
    MultiStatsCtor: WebpackMultiStats,
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
        reject(new Error('Webpack build failed!'));
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
    close: async () => {},
  };
};
