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
} from '@rsbuild/shared';
import type {
  Compiler,
  MultiCompiler,
  RspackConfig,
  RsbuildConfig,
  ModifyRspackConfigFn,
} from '../types';

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
      createAsyncHook<OnAfterCreateCompilerFn<Compiler | MultiCompiler>>(),
    onBeforeCreateCompilerHook:
      createAsyncHook<OnBeforeCreateCompilerFn<RspackConfig>>(),

    modifyBundlerChainHook: createAsyncHook<ModifyBundlerChainFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
