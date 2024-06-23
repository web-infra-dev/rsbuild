import {
  CHAIN_ID,
  type ModifyChainUtils,
  type ModifyRspackConfigUtils,
  type RsbuildTarget,
  type RspackConfig,
  castArray,
} from '@rsbuild/shared';
import { rspack } from '@rspack/core';
import { chainToConfig, modifyBundlerChain } from '../configChain';
import { getNodeEnv } from '../helpers';
import { logger } from '../logger';
import { getHTMLPlugin } from '../pluginHelper';
import { reduceConfigsAsyncWithContext } from '../reduceConfigs';
import type { InternalContext } from '../types';

async function modifyRspackConfig(
  context: InternalContext,
  rspackConfig: RspackConfig,
  utils: ModifyRspackConfigUtils,
) {
  logger.debug('modify Rspack config');
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

  logger.debug('modify Rspack config done');
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

export function getChainUtils(
  target: RsbuildTarget,
  environment: string,
): ModifyChainUtils {
  const nodeEnv = getNodeEnv();

  return {
    environment,
    env: nodeEnv,
    target,
    isDev: nodeEnv === 'development',
    isProd: nodeEnv === 'production',
    isServer: target === 'node',
    isWebWorker: target === 'web-worker',
    CHAIN_ID,
    HtmlPlugin: getHTMLPlugin(),
  };
}

export async function generateRspackConfig({
  target,
  context,
  environment,
}: {
  environment: string;
  target: RsbuildTarget;
  context: InternalContext;
}): Promise<RspackConfig> {
  const chainUtils = getChainUtils(target, environment);
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
