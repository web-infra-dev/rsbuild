import { type Rspack, logger } from '@rsbuild/core';
import type {
  BuildOptions,
  MultiStats,
  RspackConfig,
  Stats,
} from '@rsbuild/shared';
import type { Configuration as WebpackConfig } from 'webpack';
import WebpackMultiStats from 'webpack/lib/MultiStats.js';
import { createCompiler } from './createCompiler';
import { type InitConfigsOptions, initConfigs } from './initConfigs';
import { onCompileDone } from './shared';

export const build = async (
  initOptions: InitConfigsOptions,
  { mode = 'production', watch, compiler: customCompiler }: BuildOptions = {},
) => {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = mode;
  }

  const { context } = initOptions;

  let compiler: Rspack.Compiler | Rspack.MultiCompiler;
  let bundlerConfigs: WebpackConfig[] | undefined;

  if (customCompiler) {
    compiler = customCompiler;
  } else {
    const { webpackConfigs } = await initConfigs(initOptions);
    compiler = await createCompiler({
      context,
      webpackConfigs,
    });

    // assign webpackConfigs
    bundlerConfigs = webpackConfigs;
  }

  let isFirstCompile = true;
  await context.hooks.onBeforeBuild.call({
    bundlerConfigs: bundlerConfigs as RspackConfig[],
    environments: context.environments,
  });

  const onDone = async (stats: Stats | MultiStats) => {
    const p = context.hooks.onAfterBuild.call({
      isFirstCompile,
      stats,
      environments: context.environments,
    });
    isFirstCompile = false;
    await p;
  };

  onCompileDone(compiler, onDone, WebpackMultiStats);

  if (watch) {
    compiler.watch({}, (err) => {
      if (err) {
        logger.error(err);
      }
    });
    return;
  }

  await new Promise<{ stats: Stats | MultiStats }>((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err || stats?.hasErrors()) {
        const buildError = err || new Error('Webpack build failed!');
        reject(buildError);
      }
      // If there is a compilation error, the close method should not be called.
      // Otherwise bundler may generate an invalid cache.
      else {
        // When using run or watch, call close and wait for it to finish before calling run or watch again.
        // Concurrent compilations will corrupt the output files.
        compiler.close((closeErr) => {
          closeErr && logger.error(closeErr);

          // Assert type of stats must align to compiler.
          resolve({ stats: stats as any });
        });
      }
    });
  });
};
