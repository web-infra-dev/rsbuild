import { createCompiler } from './createCompiler';
import { initConfigs, type InitConfigsOptions } from './initConfigs';
import { getNodeEnv, logger, setNodeEnv } from '@rsbuild/shared';
import type {
  Stats,
  MultiStats,
  BuildOptions,
  RspackConfig,
  RspackCompiler,
  RspackMultiCompiler,
} from '@rsbuild/shared';

export const build = async (
  initOptions: InitConfigsOptions,
  { mode = 'production', watch, compiler: customCompiler }: BuildOptions = {},
) => {
  if (!getNodeEnv()) {
    setNodeEnv(mode);
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

  await context.hooks.onBeforeBuild.call({
    bundlerConfigs,
  });

  if (watch) {
    compiler.watch({}, (err) => {
      if (err) {
        logger.error(err);
      }
    });
    return;
  }

  const { stats } = await new Promise<{ stats?: Stats | MultiStats }>(
    (resolve, reject) => {
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
            resolve({ stats });
          });
        }
      });
    },
  );

  await context.hooks.onAfterBuild.call({ stats });
};
