import {
  debug,
  CHAIN_ID,
  castArray,
  modifyBundlerChain,
  mergeChainedOptions,
  type NodeEnv,
  type RspackConfig,
  type RsbuildTarget,
  type ModifyChainUtils,
  type ModifyRspackConfigUtils,
} from '@rsbuild/shared';
import { getCompiledPath } from '../shared';
import type { Context } from '../../types';
import { getHTMLPlugin } from '../htmlPluginUtil';

async function modifyRspackConfig(
  context: Context,
  rspackConfig: RspackConfig,
  utils: ModifyRspackConfigUtils,
) {
  debug('modify Rspack config');
  let [modifiedConfig] = await context.hooks.modifyRspackConfigHook.call(
    rspackConfig,
    utils,
  );

  if (context.config.tools?.rspack) {
    modifiedConfig = mergeChainedOptions({
      defaults: modifiedConfig,
      options: context.config.tools.rspack,
      utils,
      mergeFn: utils.mergeConfig,
    });
  }

  debug('modify Rspack config done');
  return modifiedConfig;
}

async function getConfigUtils(
  config: RspackConfig,
  chainUtils: ModifyChainUtils,
): Promise<ModifyRspackConfigUtils> {
  const { merge } = await import('@rsbuild/shared/webpack-merge');
  const rspack = await import('@rspack/core');

  return {
    ...chainUtils,

    rspack,

    mergeConfig: merge,

    addRules(rules) {
      const ruleArr = castArray(rules);
      if (!config.module) {
        config.module = {};
      }
      if (!config.module.rules) {
        config.module.rules = [];
      }
      config.module.rules.unshift(...ruleArr);
    },

    prependPlugins(plugins) {
      const pluginArr = castArray(plugins);
      if (!config.plugins) {
        config.plugins = [];
      }
      config.plugins.unshift(...pluginArr);
    },

    appendPlugins(plugins) {
      const pluginArr = castArray(plugins);
      if (!config.plugins) {
        config.plugins = [];
      }
      config.plugins.push(...pluginArr);
    },

    removePlugin(pluginName) {
      if (config.plugins) {
        config.plugins = config.plugins.filter(
          (p) => p && p.name !== pluginName,
        );
      }
    },
  };
}

async function getChainUtils(target: RsbuildTarget): Promise<ModifyChainUtils> {
  const nodeEnv = process.env.NODE_ENV as NodeEnv;

  return {
    env: nodeEnv,
    target,
    isProd: nodeEnv === 'production',
    isServer: target === 'node',
    isServiceWorker: target === 'service-worker',
    isWebWorker: target === 'web-worker',
    getCompiledPath,
    CHAIN_ID,
    HtmlPlugin: getHTMLPlugin(),
  };
}

export async function generateRspackConfig({
  target,
  context,
}: {
  target: RsbuildTarget;
  context: Context;
}): Promise<RspackConfig> {
  const chainUtils = await getChainUtils(target);
  const {
    BannerPlugin,
    DefinePlugin,
    ProvidePlugin,
    HotModuleReplacementPlugin,
  } = await import('@rspack/core');

  const chain = await modifyBundlerChain(context, {
    ...chainUtils,
    bundler: {
      BannerPlugin,
      DefinePlugin,
      ProvidePlugin,
      HotModuleReplacementPlugin,
    },
  });

  let rspackConfig = chain.toConfig();

  rspackConfig = await modifyRspackConfig(
    context,
    rspackConfig,
    await getConfigUtils(rspackConfig, chainUtils),
  );

  return rspackConfig;
}
