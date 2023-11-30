import {
  createAsyncHook,
  type OnExitFn,
  type OnAfterBuildFn,
  type OnBeforeBuildFn,
  type OnDevCompileDoneFn,
  type ModifyRsbuildConfigFn,
  type OnAfterStartDevServerFn,
  type OnBeforeStartDevServerFn,
  type OnAfterStartProdServerFn,
  type OnBeforeStartProdServerFn,
  type OnAfterCreateCompilerFn,
  type OnBeforeCreateCompilerFn,
  type ModifyBundlerChainFn,
  type ModifyRspackConfigFn,
} from '@rsbuild/shared';

export function initHooks() {
  return {
    /** parameters are not bundler-related */
    onExitHook: createAsyncHook<OnExitFn>(),
    onDevCompileDoneHook: createAsyncHook<OnDevCompileDoneFn>(),
    onAfterStartDevServerHook: createAsyncHook<OnAfterStartDevServerFn>(),
    onBeforeStartDevServerHook: createAsyncHook<OnBeforeStartDevServerFn>(),
    onAfterStartProdServerHook: createAsyncHook<OnAfterStartProdServerFn>(),
    onBeforeStartProdServerHook: createAsyncHook<OnBeforeStartProdServerFn>(),

    /** parameters are bundler-related */
    onAfterBuildHook: createAsyncHook<OnAfterBuildFn>(),
    onBeforeBuildHook: createAsyncHook<OnBeforeBuildFn>(),
    modifyRspackConfigHook: createAsyncHook<ModifyRspackConfigFn>(),
    modifyRsbuildConfigHook: createAsyncHook<ModifyRsbuildConfigFn>(),
    onAfterCreateCompilerHook: createAsyncHook<OnAfterCreateCompilerFn>(),
    onBeforeCreateCompilerHook: createAsyncHook<OnBeforeCreateCompilerFn>(),

    modifyBundlerChainHook: createAsyncHook<ModifyBundlerChainFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
