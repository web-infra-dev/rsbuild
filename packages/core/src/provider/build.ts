import { getNodeEnv, logger, onCompileDone, setNodeEnv } from '@rsbuild/shared';
import type {
  BuildOptions,
  MultiStats,
  Rspack,
  RspackConfig,
  Stats,
} from '@rsbuild/shared';
import { rspack } from '@rspack/core';
import { createCompiler } from './createCompiler';
import { type InitConfigsOptions, initConfigs } from './initConfigs';

export const build = async (
  initOptions: InitConfigsOptions,
  { mode = 'production', watch, compiler: customCompiler }: BuildOptions = {},
) => {
  if (!getNodeEnv()) {
    setNodeEnv(mode);
  }

  const { context } = initOptions;

  let compiler: Rspack.Compiler | Rspack.MultiCompiler;
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

  let isFirstCompile = true;
  await context.hooks.onBeforeBuild.call({
    bundlerConfigs,
  });

  const onDone = async (stats: Stats | MultiStats) => {
    const p = context.hooks.onAfterBuild.call({ isFirstCompile, stats });
    isFirstCompile = false;
    await p;
  };

  onCompileDone(
    compiler,
    onDone,
    // @ts-expect-error type mismatch
    rspack.MultiStats,
  );

  if (watch) {
    compiler.watch({}, (err) => {
      if (err) {
        logger.error(err);
      }
    });
    return;
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
