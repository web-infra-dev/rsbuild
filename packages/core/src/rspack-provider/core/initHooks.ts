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
  type RspackConfig,
  type ModifyRspackConfigFn,
} from '@rsbuild/shared';
import type { RsbuildConfig } from '../../types';

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
    onBeforeBuildHook: createAsyncHook<OnBeforeBuildFn<RspackConfig>>(),
    modifyRspackConfigHook: createAsyncHook<ModifyRspackConfigFn>(),
    modifyRsbuildConfigHook:
      createAsyncHook<ModifyRsbuildConfigFn<RsbuildConfig>>(),
    onAfterCreateCompilerHook: createAsyncHook<OnAfterCreateCompilerFn>(),
    onBeforeCreateCompilerHook:
      createAsyncHook<OnBeforeCreateCompilerFn<RspackConfig>>(),

    modifyBundlerChainHook: createAsyncHook<ModifyBundlerChainFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
