import type {
  AsyncHook,
  HookDescriptor,
  ModifyBundlerChainFn,
  ModifyEnvironmentConfigFn,
  ModifyHTMLTagsFn,
  ModifyRsbuildConfigFn,
  ModifyRspackConfigFn,
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
  OnAfterBuildFn,
  OnAfterCreateCompilerFn,
  OnAfterStartDevServerFn,
  OnAfterStartProdServerFn,
  OnBeforeBuildFn,
  OnBeforeCreateCompilerFn,
  OnBeforeStartDevServerFn,
  OnBeforeStartProdServerFn,
  OnCloseDevServerFn,
  OnDevCompileDoneFn,
  OnExitFn,
} from '@rsbuild/shared';
import { isFunction } from './helpers';

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

  const call = async (...args: Parameters<Callback>) => {
    const params = args.slice(0) as Parameters<Callback>;
    const callbacks = [...preGroup, ...defaultGroup, ...postGroup];

    for (const callback of callbacks) {
      const result = await callback(...params);

      if (result !== undefined) {
        params[0] = result;
      }
    }

    return params;
  };

  return {
    tap,
    call,
  };
}

export function initHooks() {
  return {
    onExit: createAsyncHook<OnExitFn>(),
    onAfterBuild: createAsyncHook<OnAfterBuildFn>(),
    onBeforeBuild: createAsyncHook<OnBeforeBuildFn>(),
    onDevCompileDone: createAsyncHook<OnDevCompileDoneFn>(),
    onCloseDevServer: createAsyncHook<OnCloseDevServerFn>(),
    onAfterStartDevServer: createAsyncHook<OnAfterStartDevServerFn>(),
    onBeforeStartDevServer: createAsyncHook<OnBeforeStartDevServerFn>(),
    onAfterStartProdServer: createAsyncHook<OnAfterStartProdServerFn>(),
    onBeforeStartProdServer: createAsyncHook<OnBeforeStartProdServerFn>(),
    onAfterCreateCompiler: createAsyncHook<OnAfterCreateCompilerFn>(),
    onBeforeCreateCompiler: createAsyncHook<OnBeforeCreateCompilerFn>(),
    modifyHTMLTags: createAsyncHook<ModifyHTMLTagsFn>(),
    modifyRspackConfig: createAsyncHook<ModifyRspackConfigFn>(),
    modifyBundlerChain: createAsyncHook<ModifyBundlerChainFn>(),
    modifyWebpackChain: createAsyncHook<ModifyWebpackChainFn>(),
    modifyWebpackConfig: createAsyncHook<ModifyWebpackConfigFn>(),
    modifyRsbuildConfig: createAsyncHook<ModifyRsbuildConfigFn>(),
    modifyEnvironmentConfig: createAsyncHook<ModifyEnvironmentConfigFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
