import {
  createAsyncHook,
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  OnDevCompileDoneFn,
  ModifyRsbuildConfigFn,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
  OnAfterCreateCompilerFn,
  OnBeforeCreateCompilerFn,
  ModifyBundlerChainFn,
  type RspackConfig,
  type RspackCompiler,
  type RspackMultiCompiler,
  type ModifyRspackConfigFn,
} from '@rsbuild/shared';
import type { RsbuildConfig } from '../types';

export function initHooks() {
  return {
    /** parameters are not bundler-related */
    onExitHook: createAsyncHook<OnExitFn>(),
    onDevCompileDoneHook: createAsyncHook<OnDevCompileDoneFn>(),
    onAfterStartDevServerHook: createAsyncHook<OnAfterStartDevServerFn>(),
    onBeforeStartDevServerHook: createAsyncHook<OnBeforeStartDevServerFn>(),

    /** parameters are bundler-related */
    onAfterBuildHook: createAsyncHook<OnAfterBuildFn>(),
    onBeforeBuildHook: createAsyncHook<OnBeforeBuildFn<RspackConfig>>(),
    modifyRspackConfigHook: createAsyncHook<ModifyRspackConfigFn>(),
    modifyRsbuildConfigHook:
      createAsyncHook<ModifyRsbuildConfigFn<RsbuildConfig>>(),
    onAfterCreateCompilerHook:
      createAsyncHook<
        OnAfterCreateCompilerFn<RspackCompiler | RspackMultiCompiler>
      >(),
    onBeforeCreateCompilerHook:
      createAsyncHook<OnBeforeCreateCompilerFn<RspackConfig>>(),

    modifyBundlerChainHook: createAsyncHook<ModifyBundlerChainFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
