import { isFunction } from './helpers';
import { isMultiCompiler } from './helpers/compiler';
import type {
  AsyncHook,
  EnvironmentAsyncHook,
  HookDescriptor,
  InternalContext,
  ModifyBundlerChainFn,
  ModifyEnvironmentConfigFn,
  ModifyHTMLFn,
  ModifyHTMLTagsFn,
  ModifyRsbuildConfigFn,
  ModifyRspackConfigFn,
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
  OnAfterBuildFn,
  OnAfterCreateCompilerFn,
  OnAfterDevCompileFn,
  OnAfterEnvironmentCompileFn,
  OnAfterStartDevServerFn,
  OnAfterStartProdServerFn,
  OnBeforeBuildFn,
  OnBeforeCreateCompilerFn,
  OnBeforeDevCompileFn,
  OnBeforeEnvironmentCompileFn,
  OnBeforeStartDevServerFn,
  OnBeforeStartProdServerFn,
  OnCloseBuildFn,
  OnCloseDevServerFn,
  OnExitFn,
  Rspack,
} from './types';

export function createEnvironmentAsyncHook<
  Callback extends (...args: any[]) => any,
>(): EnvironmentAsyncHook<Callback> {
  type Hook = {
    environment?: string;
    handler: Callback;
  };
  const preGroup: Hook[] = [];
  const postGroup: Hook[] = [];
  const defaultGroup: Hook[] = [];

  const tapEnvironment = ({
    environment,
    handler: cb,
  }: {
    environment?: string;
    handler: Callback | HookDescriptor<Callback>;
  }) => {
    if (isFunction(cb)) {
      defaultGroup.push({
        environment,
        handler: cb,
      });
    } else if (cb.order === 'pre') {
      preGroup.push({
        environment,
        handler: cb.handler,
      });
    } else if (cb.order === 'post') {
      postGroup.push({
        environment,
        handler: cb.handler,
      });
    } else {
      defaultGroup.push({
        environment,
        handler: cb.handler,
      });
    }
  };

  const callChain = async ({
    environment,
    args: params,
    afterEach,
  }: {
    environment?: string;
    args: Parameters<Callback>;
    afterEach?: (args: Parameters<Callback>) => void;
  }) => {
    const callbacks = [...preGroup, ...defaultGroup, ...postGroup];

    for (const callback of callbacks) {
      // If this callback is not a global callback, the environment info should match
      if (
        environment &&
        callback.environment &&
        callback.environment !== environment
      ) {
        continue;
      }

      const result = await callback.handler(...params);

      if (result !== undefined) {
        params[0] = result;
      }

      if (afterEach) {
        afterEach(params);
      }
    }

    return params;
  };

  const callBatch = async <T = unknown>({
    environment,
    args: params,
  }: {
    environment?: string;
    args: Parameters<Callback>;
  }) => {
    const callbacks = [...preGroup, ...defaultGroup, ...postGroup];
    const results: T[] = [];

    for (const callback of callbacks) {
      // If this callback is not a global callback, the environment info should match
      if (
        environment &&
        callback.environment &&
        callback.environment !== environment
      ) {
        continue;
      }

      const result = await callback.handler(...params);
      results.push(result);
    }

    return results;
  };

  return {
    tapEnvironment,
    tap: (handler: Callback | HookDescriptor<Callback>) => {
      tapEnvironment({ handler });
    },
    callChain,
    callBatch,
  };
}

export function createAsyncHook<
  Callback extends (...args: any[]) => any,
>(): AsyncHook<Callback> {
  const preGroup: Callback[] = [];
  const postGroup: Callback[] = [];
  const defaultGroup: Callback[] = [];

  const tap = (cb: Callback | HookDescriptor<Callback>) => {
    if (isFunction(cb)) {
      defaultGroup.push(cb);
    } else if (cb.order === 'pre') {
      preGroup.push(cb.handler);
    } else if (cb.order === 'post') {
      postGroup.push(cb.handler);
    } else {
      defaultGroup.push(cb.handler);
    }
  };

  const callChain = async (...params: Parameters<Callback>) => {
    const callbacks = [...preGroup, ...defaultGroup, ...postGroup];

    for (const callback of callbacks) {
      const result = await callback(...params);

      if (result !== undefined) {
        params[0] = result;
      }
    }

    return params;
  };

  const callBatch = async <T = unknown>(...params: Parameters<Callback>) => {
    const callbacks = [...preGroup, ...defaultGroup, ...postGroup];
    const results: T[] = [];

    for (const callback of callbacks) {
      const result = await callback(...params);
      results.push(result);
    }

    return results;
  };

  return {
    tap,
    callChain,
    callBatch,
  };
}

export function initHooks(): {
  /** The following hooks are global hooks */
  onExit: AsyncHook<OnExitFn>;
  onAfterBuild: AsyncHook<OnAfterBuildFn>;
  onCloseBuild: AsyncHook<OnCloseBuildFn>;
  onBeforeBuild: AsyncHook<OnBeforeBuildFn>;
  onBeforeDevCompile: AsyncHook<OnBeforeDevCompileFn>;
  onAfterDevCompile: AsyncHook<OnAfterDevCompileFn>;
  onCloseDevServer: AsyncHook<OnCloseDevServerFn>;
  onAfterStartDevServer: AsyncHook<OnAfterStartDevServerFn>;
  onBeforeStartDevServer: AsyncHook<OnBeforeStartDevServerFn>;
  onAfterStartProdServer: AsyncHook<OnAfterStartProdServerFn>;
  onBeforeStartProdServer: AsyncHook<OnBeforeStartProdServerFn>;
  onAfterCreateCompiler: AsyncHook<OnAfterCreateCompilerFn>;
  onBeforeCreateCompiler: AsyncHook<OnBeforeCreateCompilerFn>;
  /**  The following hooks are related to the environment */
  modifyHTML: EnvironmentAsyncHook<ModifyHTMLFn>;
  modifyHTMLTags: EnvironmentAsyncHook<ModifyHTMLTagsFn>;
  modifyRspackConfig: EnvironmentAsyncHook<ModifyRspackConfigFn>;
  modifyBundlerChain: EnvironmentAsyncHook<ModifyBundlerChainFn>;
  modifyWebpackChain: EnvironmentAsyncHook<ModifyWebpackChainFn>;
  modifyWebpackConfig: EnvironmentAsyncHook<ModifyWebpackConfigFn>;
  modifyRsbuildConfig: AsyncHook<ModifyRsbuildConfigFn>;
  modifyEnvironmentConfig: EnvironmentAsyncHook<ModifyEnvironmentConfigFn>;
  onBeforeEnvironmentCompile: EnvironmentAsyncHook<OnBeforeEnvironmentCompileFn>;
  onAfterEnvironmentCompile: EnvironmentAsyncHook<OnAfterEnvironmentCompileFn>;
} {
  return {
    onExit: createAsyncHook<OnExitFn>(),
    onCloseBuild: createAsyncHook<OnCloseBuildFn>(),
    onAfterBuild: createAsyncHook<OnAfterBuildFn>(),
    onBeforeBuild: createAsyncHook<OnBeforeBuildFn>(),
    onBeforeDevCompile: createAsyncHook<OnBeforeDevCompileFn>(),
    onAfterDevCompile: createAsyncHook<OnAfterDevCompileFn>(),
    onCloseDevServer: createAsyncHook<OnCloseDevServerFn>(),
    onAfterStartDevServer: createAsyncHook<OnAfterStartDevServerFn>(),
    onBeforeStartDevServer: createAsyncHook<OnBeforeStartDevServerFn>(),
    onAfterStartProdServer: createAsyncHook<OnAfterStartProdServerFn>(),
    onBeforeStartProdServer: createAsyncHook<OnBeforeStartProdServerFn>(),
    onAfterCreateCompiler: createAsyncHook<OnAfterCreateCompilerFn>(),
    onBeforeCreateCompiler: createAsyncHook<OnBeforeCreateCompilerFn>(),
    modifyHTML: createEnvironmentAsyncHook<ModifyHTMLFn>(),
    modifyHTMLTags: createEnvironmentAsyncHook<ModifyHTMLTagsFn>(),
    modifyRspackConfig: createEnvironmentAsyncHook<ModifyRspackConfigFn>(),
    modifyBundlerChain: createEnvironmentAsyncHook<ModifyBundlerChainFn>(),
    modifyWebpackChain: createEnvironmentAsyncHook<ModifyWebpackChainFn>(),
    modifyWebpackConfig: createEnvironmentAsyncHook<ModifyWebpackConfigFn>(),
    modifyRsbuildConfig: createAsyncHook<ModifyRsbuildConfigFn>(),
    modifyEnvironmentConfig:
      createEnvironmentAsyncHook<ModifyEnvironmentConfigFn>(),
    onBeforeEnvironmentCompile:
      createEnvironmentAsyncHook<OnBeforeEnvironmentCompileFn>(),
    onAfterEnvironmentCompile:
      createEnvironmentAsyncHook<OnAfterEnvironmentCompileFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;

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

    let waitBeforeCompileDone: Promise<void> | undefined;

    // Executed when a watching compilation has been invalidated (re-compilation)
    compiler.hooks.invalid.tap(name, () => {
      waitBeforeCompileDone = undefined;
    });

    for (let index = 0; index < compilers.length; index++) {
      const compiler = compilers[index];

      (isWatch ? compiler.hooks.watchRun : compiler.hooks.run).tapPromise(
        name,
        async () => {
          if (!waitBeforeCompileDone) {
            waitBeforeCompileDone = beforeCompile?.();
          }

          // beforeCompile hook should done before beforeEnvironmentCompiler run
          await waitBeforeCompileDone;

          await beforeEnvironmentCompiler(index);
        },
      );
    }
  } else {
    (isWatch ? compiler.hooks.watchRun : compiler.hooks.run).tapPromise(
      name,
      async () => {
        await beforeCompile?.();
        await beforeEnvironmentCompiler(0);
      },
    );
  }
};

const onCompileDone = ({
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
  bundlerConfigs?: Rspack.Configuration[];
  context: InternalContext;
  compiler: Rspack.Compiler | Rspack.MultiCompiler;
  isWatch: boolean;
  MultiStatsCtor: new (stats: Rspack.Stats[]) => Rspack.MultiStats;
}): void => {
  let isFirstCompile = true;

  const { environmentList } = context;

  const beforeCompile = async () =>
    context.hooks.onBeforeBuild.callBatch({
      bundlerConfigs,
      environments: context.environments,
      isWatch,
      isFirstCompile,
    });

  const beforeEnvironmentCompiler = async (buildIndex: number) =>
    context.hooks.onBeforeEnvironmentCompile.callBatch({
      environment: environmentList[buildIndex].name,
      args: [
        {
          // biome-ignore lint/suspicious/noNonNullAssertedOptionalChain: it is guaranteed to be defined
          bundlerConfig: bundlerConfigs?.[buildIndex]!,
          environment: environmentList[buildIndex],
          isWatch,
          isFirstCompile,
        },
      ],
    });

  const onDone = async (stats: Rspack.Stats | Rspack.MultiStats) => {
    const p = context.hooks.onAfterBuild.callBatch({
      isFirstCompile,
      stats,
      environments: context.environments,
      isWatch,
    });
    isFirstCompile = false;
    await p;
  };

  const onEnvironmentDone = async (buildIndex: number, stats: Rspack.Stats) => {
    await context.hooks.onAfterEnvironmentCompile.callBatch({
      environment: environmentList[buildIndex].name,
      args: [
        {
          isFirstCompile,
          stats,
          environment: environmentList[buildIndex],
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
  bundlerConfigs?: Rspack.Configuration[];
  context: InternalContext;
  compiler: Rspack.Compiler | Rspack.MultiCompiler;
  MultiStatsCtor: new (stats: Rspack.Stats[]) => Rspack.MultiStats;
}): void => {
  let isFirstCompile = true;

  const { environmentList } = context;

  const beforeCompile = async () =>
    context.hooks.onBeforeDevCompile.callBatch({
      bundlerConfigs,
      environments: context.environments,
      isFirstCompile,
      isWatch: true,
    });

  const beforeEnvironmentCompiler = async (buildIndex: number) =>
    context.hooks.onBeforeEnvironmentCompile.callBatch({
      environment: environmentList[buildIndex].name,
      args: [
        {
          // biome-ignore lint/suspicious/noNonNullAssertedOptionalChain: it is guaranteed to be defined
          bundlerConfig: bundlerConfigs?.[buildIndex]!,
          environment: environmentList[buildIndex],
          isWatch: true,
          isFirstCompile,
        },
      ],
    });

  const onDone = async (stats: Rspack.Stats | Rspack.MultiStats) => {
    const p = context.hooks.onAfterDevCompile.callBatch({
      isFirstCompile,
      stats,
      environments: context.environments,
    });
    isFirstCompile = false;
    await p;
  };

  const onEnvironmentDone = async (buildIndex: number, stats: Rspack.Stats) => {
    await context.hooks.onAfterEnvironmentCompile.callBatch({
      environment: environmentList[buildIndex].name,
      args: [
        {
          isFirstCompile,
          stats,
          environment: environmentList[buildIndex],
          isWatch: true,
        },
      ],
    });
  };

  onBeforeCompile({
    compiler,
    beforeEnvironmentCompiler,
    beforeCompile,
    isWatch: true,
  });

  onCompileDone({
    compiler,
    onDone,
    onEnvironmentDone,
    MultiStatsCtor,
  });
};
