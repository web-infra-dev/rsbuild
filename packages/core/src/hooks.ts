import { isMultiCompiler } from './helpers';
import type {
  EnvironmentContext,
  InternalContext,
  MultiStats,
  Rspack,
  RspackConfig,
  Stats,
} from './types';

const onBeforeCompile = ({
  compiler,
  beforeCompile,
  beforeEnvironmentCompiler,
  isWatch,
}: {
  compiler: Rspack.Compiler | Rspack.MultiCompiler;
  beforeCompile?: () => Promise<any>;
  beforeEnvironmentCompiler: (buildIndex: number) => Promise<any>;
  isWatch?: boolean;
}): void => {
  const name = 'rsbuild:beforeCompile';

  if (isMultiCompiler(compiler)) {
    const { compilers } = compiler;

    let doneCompilers = 0;

    for (let index = 0; index < compilers.length; index++) {
      const compiler = compilers[index];
      let compilerDone = false;

      (isWatch ? compiler.hooks.watchRun : compiler.hooks.run).tapPromise(
        name,
        async () => {
          if (!compilerDone) {
            compilerDone = true;
            doneCompilers++;
          }
          // ensure only last compiler done will trigger beforeCompile hook
          // avoid other compiler done triggers when executing async beforeEnvironmentCompiler hook
          const lastCompilerDone = doneCompilers === compilers.length;

          await beforeEnvironmentCompiler(index);

          if (lastCompilerDone) {
            await beforeCompile?.();
          }
        },
      );

      compiler.hooks.invalid.tap(name, () => {
        if (compilerDone) {
          compilerDone = false;
          doneCompilers--;
        }
      });
    }
  } else {
    (isWatch ? compiler.hooks.watchRun : compiler.hooks.run).tapPromise(
      name,
      async () => {
        await beforeEnvironmentCompiler(0);
        await beforeCompile?.();
      },
    );
  }
};

export const onCompileDone = ({
  compiler,
  onDone,
  onEnvironmentDone,
  MultiStatsCtor,
}: {
  compiler: Rspack.Compiler | Rspack.MultiCompiler;
  onDone: (stats: Rspack.Stats | Rspack.MultiStats) => Promise<void>;
  onEnvironmentDone: (buildIndex: number, stats: Rspack.Stats) => Promise<void>;
  MultiStatsCtor: new (stats: Rspack.Stats[]) => Rspack.MultiStats;
}): void => {
  // The MultiCompiler of Rspack does not supports `done.tapPromise`,
  // so we need to use the `done` hook of `MultiCompiler.compilers` to implement it.
  if (isMultiCompiler(compiler)) {
    const { compilers } = compiler;
    const compilerStats: Rspack.Stats[] = [];
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

        const lastCompilerDone = doneCompilers === compilers.length;

        await onEnvironmentDone(index, stats);

        if (lastCompilerDone) {
          await onDone(new MultiStatsCtor(compilerStats));
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
    compiler.hooks.done.tapPromise('rsbuild:done', async (stats) => {
      await onEnvironmentDone(0, stats);
      await onDone(stats);
    });
  }
};

export const registerBuildHook = ({
  context,
  isWatch,
  compiler,
  bundlerConfigs,
  MultiStatsCtor,
}: {
  bundlerConfigs?: RspackConfig[];
  context: InternalContext;
  compiler: Rspack.Compiler | Rspack.MultiCompiler;
  isWatch: boolean;
  MultiStatsCtor: new (stats: Rspack.Stats[]) => Rspack.MultiStats;
}): void => {
  let isFirstCompile = true;

  const environmentArr = Object.values(context.environments).reduce<
    EnvironmentContext[]
  >((prev, curr) => {
    prev[curr.index] = curr;
    return prev;
  }, []);

  const beforeCompile = async () =>
    await context.hooks.onBeforeBuild.call({
      bundlerConfigs,
      environments: context.environments,
      isWatch,
      isFirstCompile,
    });

  const beforeEnvironmentCompiler = async (buildIndex: number) =>
    await context.hooks.onBeforeEnvironmentCompile.callInEnvironment({
      environment: environmentArr[buildIndex].name,
      args: [
        {
          bundlerConfig: bundlerConfigs?.[buildIndex] as Rspack.Configuration,
          environment: environmentArr[buildIndex],
          isWatch,
          isFirstCompile,
        },
      ],
    });

  const onDone = async (stats: Stats | MultiStats) => {
    const p = context.hooks.onAfterBuild.call({
      isFirstCompile,
      stats,
      environments: context.environments,
      isWatch,
    });
    isFirstCompile = false;
    await p;
  };

  const onEnvironmentDone = async (buildIndex: number, stats: Stats) => {
    await context.hooks.onAfterEnvironmentCompile.callInEnvironment({
      environment: environmentArr[buildIndex].name,
      args: [
        {
          isFirstCompile,
          stats,
          environment: environmentArr[buildIndex],
          isWatch,
        },
      ],
    });
  };

  onBeforeCompile({
    compiler,
    beforeCompile,
    beforeEnvironmentCompiler,
    isWatch,
  });

  onCompileDone({
    compiler,
    onDone,
    onEnvironmentDone,
    MultiStatsCtor,
  });
};

export const registerDevHook = ({
  context,
  compiler,
  bundlerConfigs,
  MultiStatsCtor,
}: {
  bundlerConfigs?: RspackConfig[];
  context: InternalContext;
  compiler: Rspack.Compiler | Rspack.MultiCompiler;
  MultiStatsCtor: new (stats: Rspack.Stats[]) => Rspack.MultiStats;
}): void => {
  let isFirstCompile = true;

  const environmentArr = Object.values(context.environments).reduce<
    EnvironmentContext[]
  >((prev, curr) => {
    prev[curr.index] = curr;
    return prev;
  }, []);

  const beforeEnvironmentCompiler = async (buildIndex: number) =>
    await context.hooks.onBeforeEnvironmentCompile.callInEnvironment({
      environment: environmentArr[buildIndex].name,
      args: [
        {
          bundlerConfig: bundlerConfigs?.[buildIndex] as Rspack.Configuration,
          environment: environmentArr[buildIndex],
          isWatch: true,
          isFirstCompile,
        },
      ],
    });

  const onDone = async (stats: Stats | MultiStats) => {
    const p = context.hooks.onDevCompileDone.call({
      isFirstCompile,
      stats,
      environments: context.environments,
    });
    isFirstCompile = false;
    await p;
  };

  const onEnvironmentDone = async (buildIndex: number, stats: Stats) => {
    await context.hooks.onAfterEnvironmentCompile.callInEnvironment({
      environment: environmentArr[buildIndex].name,
      args: [
        {
          isFirstCompile,
          stats,
          environment: environmentArr[buildIndex],
          isWatch: true,
        },
      ],
    });
  };

  onBeforeCompile({
    compiler,
    beforeEnvironmentCompiler,
    isWatch: true,
  });

  onCompileDone({
    compiler,
    onDone,
    onEnvironmentDone,
    MultiStatsCtor,
  });
};
