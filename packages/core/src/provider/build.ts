import { createCompiler } from './createCompiler';
import { initConfigs, type InitConfigsOptions } from './initConfigs';
import {
  logger,
  getNodeEnv,
  setNodeEnv,
  isMultiCompiler,
} from '@rsbuild/shared';
import { MultiStats } from '@rspack/core';
import type {
  Stats,
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

  let isFirstCompile = true;
  await context.hooks.onBeforeBuild.call({
    bundlerConfigs,
  });

  const onDone = async (stats: Stats | MultiStats) => {
    const p = context.hooks.onAfterBuild.call({ isFirstCompile, stats });
    isFirstCompile = false;
    await p;
  };

  // MultiCompiler does not supports `done.tapPromise`
  if (isMultiCompiler(compiler)) {
    const { compilers } = compiler;
    const compilerStats: Stats[] = [];
    let doneCompilers = 0;

    for (let index = 0; index < compilers.length; index++) {
      const compiler = compilers[index];
      const compilerIndex = index;
      let compilerDone = false;

      compiler.hooks.done.tapPromise('rsbuild:done', async (stats) => {
        if (!compilerDone) {
          compilerDone = true;
          doneCompilers++;
        }

        compilerStats[compilerIndex] = stats;

        if (doneCompilers === compilers.length) {
          // @ts-expect-error
          await onDone(new MultiStats(compilerStats));
        }
      });

      compiler.hooks.invalid.tap('rsbuild:done', () => {
        if (compilerDone) {
          compilerDone = false;
          doneCompilers--;
        }
      });
    }
  } else {
    compiler.hooks.done.tapPromise('rsbuild:done', onDone);
  }

  if (watch) {
    compiler.watch({}, (err) => {
      if (err) {
        logger.error(err);
      }
    });
    return;
  }

  await new Promise<{ stats?: Stats | MultiStats }>((resolve, reject) => {
    compiler.run((err: any, stats?: Stats | MultiStats) => {
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
  });
};
