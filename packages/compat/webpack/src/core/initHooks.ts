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
import type { WebpackConfig } from '../types';

export function initHooks() {
  return {
    onExitHook: createAsyncHook<OnExitFn>(),
    onAfterBuildHook: createAsyncHook<OnAfterBuildFn>(),
    onBeforeBuildHook: createAsyncHook<OnBeforeBuildFn<WebpackConfig>>(),
    onDevCompileDoneHook: createAsyncHook<OnDevCompileDoneFn>(),
    modifyWebpackChainHook: createAsyncHook<ModifyWebpackChainFn>(),
    modifyWebpackConfigHook: createAsyncHook<ModifyWebpackConfigFn>(),
    modifyRsbuildConfigHook: createAsyncHook<ModifyRsbuildConfigFn>(),
    onAfterCreateCompilerHook: createAsyncHook<OnAfterCreateCompilerFn>(),
    onBeforeCreateCompilerHook:
      createAsyncHook<OnBeforeCreateCompilerFn<WebpackConfig>>(),
    onAfterStartDevServerHook: createAsyncHook<OnAfterStartDevServerFn>(),
    onBeforeStartDevServerHook: createAsyncHook<OnBeforeStartDevServerFn>(),
    onAfterStartProdServerHook: createAsyncHook<OnAfterStartProdServerFn>(),
    onBeforeStartProdServerHook: createAsyncHook<OnBeforeStartProdServerFn>(),
    modifyBundlerChainHook: createAsyncHook<ModifyBundlerChainFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
