import { createAsyncHook } from '@rsbuild/shared';
import type {
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  OnDevCompileDoneFn,
  ModifyBundlerChainFn,
  ModifyRspackConfigFn,
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
  ModifyRsbuildConfigFn,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
  OnAfterStartProdServerFn,
  OnBeforeStartProdServerFn,
  OnAfterCreateCompilerFn,
  OnBeforeCreateCompilerFn,
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
    modifyBundlerChainHook: createAsyncHook<ModifyBundlerChainFn>(),
    modifyWebpackChainHook: createAsyncHook<ModifyWebpackChainFn>(),
    modifyWebpackConfigHook: createAsyncHook<ModifyWebpackConfigFn>(),
    modifyRsbuildConfigHook: createAsyncHook<ModifyRsbuildConfigFn>(),
    onAfterCreateCompilerHook: createAsyncHook<OnAfterCreateCompilerFn>(),
    onBeforeCreateCompilerHook: createAsyncHook<OnBeforeCreateCompilerFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
