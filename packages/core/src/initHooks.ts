import { isFunction } from './helpers';
import { isPluginMatchEnvironment } from './pluginManager';
import type {
  AsyncHook,
  EnvironmentAsyncHook,
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
} from './types';

export function createEnvironmentAsyncHook<
  Callback extends (...args: any[]) => any,
>(): EnvironmentAsyncHook<Callback> {
  type Hook = {
    environment?: string;
    handler: Callback;
  };
  const preGroup: Hook[] = [];
  const postGroup: Hook[] = [];
  const defaultGroup: Hook[] = [];

  const tapEnvironment = ({
    environment,
    handler: cb,
  }: {
    environment?: string;
    handler: Callback | HookDescriptor<Callback>;
  }) => {
    if (isFunction(cb)) {
      defaultGroup.push({
        environment,
        handler: cb,
      });
    } else if (cb.order === 'pre') {
      preGroup.push({
        environment,
        handler: cb.handler,
      });
    } else if (cb.order === 'post') {
      postGroup.push({
        environment,
        handler: cb.handler,
      });
    } else {
      defaultGroup.push({
        environment,
        handler: cb.handler,
      });
    }
  };

  const callInEnvironment = async ({
    environment,
    args: params,
  }: {
    environment?: string;
    args: Parameters<Callback>;
  }) => {
    const callbacks = [...preGroup, ...defaultGroup, ...postGroup];

    for (const callback of callbacks) {
      // If this callback is not a global callback, the environment info should match
      if (
        callback.environment &&
        environment &&
        !isPluginMatchEnvironment(callback.environment, environment)
      ) {
        continue;
      }

      const result = await callback.handler(...params);

      if (result !== undefined) {
        params[0] = result;
      }
    }

    return params;
  };

  return {
    tapEnvironment,
    tap: (handler: Callback | HookDescriptor<Callback>) =>
      tapEnvironment({ handler }),
    callInEnvironment,
  };
}

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

  const call = async (...params: Parameters<Callback>) => {
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

export function initHooks(): {
  /** The following hooks are global hooks */
  onExit: AsyncHook<OnExitFn>;
  onAfterBuild: AsyncHook<OnAfterBuildFn>;
  onBeforeBuild: AsyncHook<OnBeforeBuildFn>;
  onDevCompileDone: AsyncHook<OnDevCompileDoneFn>;
  onCloseDevServer: AsyncHook<OnCloseDevServerFn>;
  onAfterStartDevServer: AsyncHook<OnAfterStartDevServerFn>;
  onBeforeStartDevServer: AsyncHook<OnBeforeStartDevServerFn>;
  onAfterStartProdServer: AsyncHook<OnAfterStartProdServerFn>;
  onBeforeStartProdServer: AsyncHook<OnBeforeStartProdServerFn>;
  onAfterCreateCompiler: AsyncHook<OnAfterCreateCompilerFn>;
  onBeforeCreateCompiler: AsyncHook<OnBeforeCreateCompilerFn>;
  /**  The following hooks are related to the environment */
  modifyHTMLTags: EnvironmentAsyncHook<ModifyHTMLTagsFn>;
  modifyRspackConfig: EnvironmentAsyncHook<ModifyRspackConfigFn>;
  modifyBundlerChain: EnvironmentAsyncHook<ModifyBundlerChainFn>;
  modifyWebpackChain: EnvironmentAsyncHook<ModifyWebpackChainFn>;
  modifyWebpackConfig: EnvironmentAsyncHook<ModifyWebpackConfigFn>;
  modifyRsbuildConfig: AsyncHook<ModifyRsbuildConfigFn>;
  modifyEnvironmentConfig: EnvironmentAsyncHook<ModifyEnvironmentConfigFn>;
} {
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
    modifyHTMLTags: createEnvironmentAsyncHook<ModifyHTMLTagsFn>(),
    modifyRspackConfig: createEnvironmentAsyncHook<ModifyRspackConfigFn>(),
    modifyBundlerChain: createEnvironmentAsyncHook<ModifyBundlerChainFn>(),
    modifyWebpackChain: createEnvironmentAsyncHook<ModifyWebpackChainFn>(),
    modifyWebpackConfig: createEnvironmentAsyncHook<ModifyWebpackConfigFn>(),
    modifyRsbuildConfig: createAsyncHook<ModifyRsbuildConfigFn>(),
    modifyEnvironmentConfig:
      createEnvironmentAsyncHook<ModifyEnvironmentConfigFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
