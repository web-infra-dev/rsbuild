import { createAsyncHook } from '@rsbuild/shared';
import type {
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  OnDevCompileDoneFn,
  ModifyBundlerChainFn,
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
  ModifyRsbuildConfigFn,
  OnAfterCreateCompilerFn,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
  OnAfterStartProdServerFn,
  OnBeforeStartProdServerFn,
  OnBeforeCreateCompilerFn,
} from '@rsbuild/shared';

export function initHooks() {
  return {
    onExitHook: createAsyncHook<OnExitFn>(),
    onAfterBuildHook: createAsyncHook<OnAfterBuildFn>(),
    onBeforeBuildHook: createAsyncHook<OnBeforeBuildFn>(),
    onDevCompileDoneHook: createAsyncHook<OnDevCompileDoneFn>(),
    modifyWebpackChainHook: createAsyncHook<ModifyWebpackChainFn>(),
    modifyWebpackConfigHook: createAsyncHook<ModifyWebpackConfigFn>(),
    modifyRsbuildConfigHook: createAsyncHook<ModifyRsbuildConfigFn>(),
    onAfterCreateCompilerHook: createAsyncHook<OnAfterCreateCompilerFn>(),
    onBeforeCreateCompilerHook: createAsyncHook<OnBeforeCreateCompilerFn>(),
    onAfterStartDevServerHook: createAsyncHook<OnAfterStartDevServerFn>(),
    onBeforeStartDevServerHook: createAsyncHook<OnBeforeStartDevServerFn>(),
    onAfterStartProdServerHook: createAsyncHook<OnAfterStartProdServerFn>(),
    onBeforeStartProdServerHook: createAsyncHook<OnBeforeStartProdServerFn>(),
    modifyBundlerChainHook: createAsyncHook<ModifyBundlerChainFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
