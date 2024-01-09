import {
  getDistPath,
  onExitProcess,
  removeLeadingSlash,
  type PluginStore,
  type RsbuildPluginAPI,
  type GetRsbuildConfig,
} from '@rsbuild/shared';
import { createPublicContext } from './createContext';
import type { InternalContext, NormalizedConfig } from '../../types';

export function getHTMLPathByEntry(
  entryName: string,
  config: NormalizedConfig,
) {
  const htmlPath = getDistPath(config, 'html');
  const filename =
    config.html.outputStructure === 'flat'
      ? `${entryName}.html`
      : `${entryName}/index.html`;

  return removeLeadingSlash(`${htmlPath}/${filename}`);
}

export function getPluginAPI({
  context,
  pluginStore,
}: {
  context: InternalContext;
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
    hooks.onExit.call();
  });

  return {
    context: publicContext,
    getHTMLPaths,
    getRsbuildConfig,
    getNormalizedConfig,
    isPluginExists: pluginStore.isPluginExists,

    // Hooks
    onExit: hooks.onExit.tap,
    onAfterBuild: hooks.onAfterBuild.tap,
    onBeforeBuild: hooks.onBeforeBuild.tap,
    onDevCompileDone: hooks.onDevCompileDone.tap,
    modifyBundlerChain: hooks.modifyBundlerChain.tap,
    modifyRspackConfig: hooks.modifyRspackConfig.tap,
    modifyWebpackChain: hooks.modifyWebpackChain.tap,
    modifyWebpackConfig: hooks.modifyWebpackConfig.tap,
    modifyRsbuildConfig: hooks.modifyRsbuildConfig.tap,
    onAfterCreateCompiler: hooks.onAfterCreateCompiler.tap,
    onAfterStartDevServer: hooks.onAfterStartDevServer.tap,
    onBeforeCreateCompiler: hooks.onBeforeCreateCompiler.tap,
    onBeforeStartDevServer: hooks.onBeforeStartDevServer.tap,
    onAfterStartProdServer: hooks.onAfterStartProdServer.tap,
    onBeforeStartProdServer: hooks.onBeforeStartProdServer.tap,
  };
}
