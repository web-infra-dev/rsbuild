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
    onExit: createAsyncHook<OnExitFn>(),
    onDevCompileDone: createAsyncHook<OnDevCompileDoneFn>(),
    onAfterStartDevServer: createAsyncHook<OnAfterStartDevServerFn>(),
    onBeforeStartDevServer: createAsyncHook<OnBeforeStartDevServerFn>(),
    onAfterStartProdServer: createAsyncHook<OnAfterStartProdServerFn>(),
    onBeforeStartProdServer: createAsyncHook<OnBeforeStartProdServerFn>(),

    /** parameters are bundler-related */
    onAfterBuild: createAsyncHook<OnAfterBuildFn>(),
    onBeforeBuild: createAsyncHook<OnBeforeBuildFn>(),
    modifyRspackConfig: createAsyncHook<ModifyRspackConfigFn>(),
    modifyBundlerChain: createAsyncHook<ModifyBundlerChainFn>(),
    modifyWebpackChain: createAsyncHook<ModifyWebpackChainFn>(),
    modifyWebpackConfig: createAsyncHook<ModifyWebpackConfigFn>(),
    modifyRsbuildConfig: createAsyncHook<ModifyRsbuildConfigFn>(),
    onAfterCreateCompiler: createAsyncHook<OnAfterCreateCompilerFn>(),
    onBeforeCreateCompiler: createAsyncHook<OnBeforeCreateCompilerFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
