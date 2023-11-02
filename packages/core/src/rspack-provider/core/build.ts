import { createCompiler } from './createCompiler';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import {
  logger,
  BuildOptions,
  Stats,
  MultiStats,
  RspackConfig,
  RspackCompiler,
  RspackMultiCompiler,
} from '@rsbuild/shared';

export type BuildExecuter = {
  (compiler: RspackCompiler): Promise<{ stats?: Stats }>;
  (compiler: RspackMultiCompiler): Promise<{ stats?: MultiStats }>;
  (
    compiler: RspackCompiler | RspackMultiCompiler,
  ): Promise<{ stats?: Stats | MultiStats }>;
};

export const rspackBuild: BuildExecuter = async (compiler) => {
  return new Promise((resolve, reject) => {
    compiler.run((err: any, stats?: Stats) => {
      if (err || stats?.hasErrors()) {
        const buildError = err || new Error('Rspack build failed!');
        reject(buildError);
      }
      // If there is a compilation error, the close method should not be called.
      // Otherwise the bundler may generate an invalid cache.
      else {
        // When using run or watch, call close and wait for it to finish before calling run or watch again.
        // Concurrent compilations will corrupt the output files.
        compiler.close(() => {
          // Assert type of stats must align to compiler.
          resolve({ stats: stats as any });
        });
      }
    });
  });
};

export const build = async (
  initOptions: InitConfigsOptions,
  { mode = 'production', watch, compiler: customCompiler }: BuildOptions = {},
  executer?: BuildExecuter,
) => {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = mode;
  }

  const { context } = initOptions;

  let compiler: RspackCompiler | RspackMultiCompiler;
  let bundlerConfigs: RspackConfig[] | undefined;

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

  await context.hooks.onBeforeBuildHook.call({
    bundlerConfigs,
  });

  if (watch) {
    compiler.watch({}, (err) => {
      if (err) {
        logger.error(err);
      }
    });
  } else {
    const executeResult = await executer?.(compiler);
    await context.hooks.onAfterBuildHook.call({
      stats: executeResult?.stats,
    });
  }
};
