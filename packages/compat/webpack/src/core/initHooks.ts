import {
  createAsyncHook,
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  OnDevCompileDoneFn,
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
  ModifyRsbuildConfigFn,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
  OnAfterCreateCompilerFn,
  OnBeforeCreateCompilerFn,
} from '@rsbuild/shared';
import type { ModifyBundlerChainFn } from '@rsbuild/shared';
import type { Compiler, MultiCompiler } from 'webpack';
import type { WebpackConfig, RsbuildConfig } from '../types';

export function initHooks() {
  return {
    onExitHook: createAsyncHook<OnExitFn>(),
    onAfterBuildHook: createAsyncHook<OnAfterBuildFn>(),
    onBeforeBuildHook: createAsyncHook<OnBeforeBuildFn<WebpackConfig>>(),
    onDevCompileDoneHook: createAsyncHook<OnDevCompileDoneFn>(),
    modifyWebpackChainHook: createAsyncHook<ModifyWebpackChainFn>(),
    modifyWebpackConfigHook: createAsyncHook<ModifyWebpackConfigFn>(),
    modifyRsbuildConfigHook:
      createAsyncHook<ModifyRsbuildConfigFn<RsbuildConfig>>(),
    onAfterCreateCompilerHook:
      createAsyncHook<OnAfterCreateCompilerFn<Compiler | MultiCompiler>>(),
    onBeforeCreateCompilerHook:
      createAsyncHook<OnBeforeCreateCompilerFn<WebpackConfig>>(),
    onAfterStartDevServerHook: createAsyncHook<OnAfterStartDevServerFn>(),
    onBeforeStartDevServerHook: createAsyncHook<OnBeforeStartDevServerFn>(),
    modifyBundlerChainHook: createAsyncHook<ModifyBundlerChainFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
