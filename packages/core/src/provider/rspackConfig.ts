import { rspack } from '@rspack/core';
import { reduceConfigsAsyncWithContext } from 'reduce-configs';
import { CHAIN_ID, chainToConfig, modifyBundlerChain } from '../configChain';
import { castArray, getNodeEnv } from '../helpers';
import { logger } from '../logger';
import { getHTMLPlugin } from '../pluginHelper';
import type {
  EnvironmentContext,
  InternalContext,
  ModifyChainUtils,
  ModifyRspackConfigUtils,
  RsbuildTarget,
  Rspack,
  RspackConfig,
} from '../types';

async function modifyRspackConfig(
  context: InternalContext,
  rspackConfig: RspackConfig,
  utils: ModifyRspackConfigUtils,
) {
  logger.debug('modify Rspack config');
  let [modifiedConfig] =
    await context.hooks.modifyRspackConfig.callInEnvironment({
      environment: utils.environment.name,
      args: [rspackConfig, utils],
    });

  if (utils.environment.config.tools?.rspack) {
    modifiedConfig = await reduceConfigsAsyncWithContext({
      initial: modifiedConfig,
      config: utils.environment.config.tools.rspack,
      ctx: utils,
      mergeFn: utils.mergeConfig,
    });
  }

  logger.debug('modify Rspack config done');
  return modifiedConfig;
}

export async function getConfigUtils(
  config: Rspack.Configuration,
  chainUtils: ModifyChainUtils,
): Promise<ModifyRspackConfigUtils> {
  const { merge } = await import('webpack-merge');

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
      if (!config.plugins) {
        return;
      }
      config.plugins = config.plugins.filter((plugin) => {
        if (!plugin) {
          return true;
        }
        const name = plugin.name || plugin.constructor.name;
        return name !== pluginName;
      });
    },
  };
}

export function getChainUtils(
  target: RsbuildTarget,
  environment: EnvironmentContext,
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
  const chainUtils = getChainUtils(target, context.environments[environment]);
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
