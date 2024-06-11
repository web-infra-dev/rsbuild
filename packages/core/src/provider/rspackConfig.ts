import {
  CHAIN_ID,
  type ModifyChainUtils,
  type ModifyRspackConfigUtils,
  type RsbuildTarget,
  type RspackConfig,
  castArray,
  chainToConfig,
  debug,
  getNodeEnv,
  modifyBundlerChain,
  reduceConfigsAsyncWithContext,
} from '@rsbuild/shared';
import { rspack } from '@rspack/core';
import { getHTMLPlugin } from '../pluginHelper';
import type { InternalContext } from '../types';

async function modifyRspackConfig(
  context: InternalContext,
  rspackConfig: RspackConfig,
  utils: ModifyRspackConfigUtils,
) {
  debug('modify Rspack config');
  let [modifiedConfig] = await context.hooks.modifyRspackConfig.call(
    rspackConfig,
    utils,
  );

  if (context.config.tools?.rspack) {
    modifiedConfig = await reduceConfigsAsyncWithContext({
      initial: modifiedConfig,
      config: context.config.tools.rspack,
      ctx: utils,
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

export function getChainUtils(target: RsbuildTarget): ModifyChainUtils {
  const nodeEnv = getNodeEnv();

  return {
    env: nodeEnv,
    target,
    isDev: nodeEnv === 'development',
    isProd: nodeEnv === 'production',
    isServer: target === 'node',
    isWebWorker: target === 'web-worker',
    isServiceWorker: target === 'service-worker',
    CHAIN_ID,
    HtmlPlugin: getHTMLPlugin(),
  };
}

export async function generateRspackConfig({
  target,
  context,
}: {
  target: RsbuildTarget;
  context: InternalContext;
}): Promise<RspackConfig> {
  const chainUtils = getChainUtils(target);
  const {
    BannerPlugin,
    DefinePlugin,
    IgnorePlugin,
    ProvidePlugin,
    HotModuleReplacementPlugin,
  } = rspack;

  const chain = await modifyBundlerChain(context, {
    ...chainUtils,
    bundler: {
      BannerPlugin,
      DefinePlugin,
      IgnorePlugin,
      ProvidePlugin,
      HotModuleReplacementPlugin,
    },
  });

  let rspackConfig = chainToConfig(chain);

  rspackConfig = await modifyRspackConfig(
    context,
    rspackConfig,
    await getConfigUtils(rspackConfig, chainUtils),
  );

  return rspackConfig;
}
