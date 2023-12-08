import {
  onExitProcess,
  getHTMLPathByEntry,
  type PluginStore,
  type RsbuildPluginAPI,
  type GetRsbuildConfig,
} from '@rsbuild/shared';
import { createPublicContext } from './createContext';
import type { Context } from '../../types';

export function getPluginAPI({
  context,
  pluginStore,
}: {
  context: Context;
  pluginStore: PluginStore;
}): RsbuildPluginAPI {
  const { hooks } = context;
  const publicContext = createPublicContext(context);

  const getNormalizedConfig = () => {
    if (context.normalizedConfig) {
      return context.normalizedConfig;
    }
    throw new Error(
      'Cannot access normalized config until modifyRsbuildConfig is called.',
    );
  };

  const getRsbuildConfig = ((type = 'current') => {
    switch (type) {
      case 'original':
        return context.originalConfig;
      case 'current':
        return context.config;
      case 'normalized':
        return getNormalizedConfig();
    }
    throw new Error('`getRsbuildConfig` get an invalid type param.');
  }) as GetRsbuildConfig;

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
    modifyRspackConfig: hooks.modifyRspackConfigHook.tap,
    modifyWebpackChain: hooks.modifyWebpackChainHook.tap,
    modifyWebpackConfig: hooks.modifyWebpackConfigHook.tap,
    modifyRsbuildConfig: hooks.modifyRsbuildConfigHook.tap,
    onAfterCreateCompiler: hooks.onAfterCreateCompilerHook.tap,
    onAfterStartDevServer: hooks.onAfterStartDevServerHook.tap,
    onBeforeCreateCompiler: hooks.onBeforeCreateCompilerHook.tap,
    onBeforeStartDevServer: hooks.onBeforeStartDevServerHook.tap,
    onAfterStartProdServer: hooks.onAfterStartProdServerHook.tap,
    onBeforeStartProdServer: hooks.onBeforeStartProdServerHook.tap,
  };
}
