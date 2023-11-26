import {
  onExitProcess,
  getHTMLPathByEntry,
  type PluginStore,
} from '@rsbuild/shared';
import { createPublicContext } from '@rsbuild/core/rspack-provider';
import type { Context, RsbuildPluginAPI } from '../types';

export function getPluginAPI({
  context,
  pluginStore,
}: {
  context: Context;
  pluginStore: PluginStore;
}): RsbuildPluginAPI {
  const { hooks } = context;
  const publicContext = createPublicContext(context);

  const getRsbuildConfig = () => {
    if (!context.normalizedConfig) {
      throw new Error(
        'Cannot access Rsbuild config until modifyRsbuildConfig is called.',
      );
    }
    return context.config;
  };

  const getNormalizedConfig = () => {
    if (!context.normalizedConfig) {
      throw new Error(
        'Cannot access normalized config until modifyRsbuildConfig is called.',
      );
    }
    return context.normalizedConfig;
  };

  const getHTMLPaths = () => {
    return Object.keys(context.entry).reduce<Record<string, string>>(
      (prev, key) => {
        prev[key] = getHTMLPathByEntry(key, getNormalizedConfig());
        return prev;
      },
      {},
    );
  };

  onExitProcess(() => {
    hooks.onExitHook.call();
  });

  return {
    context: publicContext,
    getHTMLPaths,
    getRsbuildConfig,
    getNormalizedConfig,
    isPluginExists: pluginStore.isPluginExists,

    // Hooks
    onExit: hooks.onExitHook.tap,
    onAfterBuild: hooks.onAfterBuildHook.tap,
    onBeforeBuild: hooks.onBeforeBuildHook.tap,
    onDevCompileDone: hooks.onDevCompileDoneHook.tap,
    modifyBundlerChain: hooks.modifyBundlerChainHook.tap,
    modifyWebpackChain: hooks.modifyWebpackChainHook.tap,
    modifyWebpackConfig: hooks.modifyWebpackConfigHook.tap,
    modifyRsbuildConfig: hooks.modifyRsbuildConfigHook.tap,
    onAfterCreateCompiler: hooks.onAfterCreateCompilerHook.tap,
    onBeforeCreateCompiler: hooks.onBeforeCreateCompilerHook.tap,
    onAfterStartDevServer: hooks.onAfterStartDevServerHook.tap,
    onBeforeStartDevServer: hooks.onBeforeStartDevServerHook.tap,
    onAfterStartProdServer: hooks.onAfterStartProdServerHook.tap,
    onBeforeStartProdServer: hooks.onBeforeStartProdServerHook.tap,
    modifyRspackConfig: () => {},
  };
}
