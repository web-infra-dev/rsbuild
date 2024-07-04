import {
  type RsbuildTarget,
  type RspackChain,
  __internalHelper,
  logger,
} from '@rsbuild/core';
import type {
  EnvironmentContext,
  ModifyWebpackChainUtils,
  ModifyWebpackConfigUtils,
} from '@rsbuild/shared';
import { reduceConfigsWithContext } from 'reduce-configs';
import type { RuleSetRule, WebpackPluginInstance } from 'webpack';
import {
  type InternalContext,
  castArray,
  chainToConfig,
  getChainUtils as getBaseChainUtils,
  modifyBundlerChain,
} from './shared';
import type { WebpackConfig } from './types';

async function modifyWebpackChain(
  context: InternalContext,
  utils: ModifyWebpackChainUtils,
  chain: RspackChain,
): Promise<RspackChain> {
  logger.debug('modify webpack chain');

  const [modifiedChain] = await context.hooks.modifyWebpackChain.call(
    chain,
    utils,
  );

  if (context.config.tools?.webpackChain) {
    for (const item of castArray(context.config.tools.webpackChain)) {
      item(modifiedChain, utils);
    }
  }

  logger.debug('modify webpack chain done');

  return modifiedChain;
}

async function modifyWebpackConfig(
  context: InternalContext,
  webpackConfig: WebpackConfig,
  utils: ModifyWebpackConfigUtils,
): Promise<WebpackConfig> {
  logger.debug('modify webpack config');
  let [modifiedConfig] = await context.hooks.modifyWebpackConfig.call(
    webpackConfig,
    utils,
  );

  if (context.config.tools?.webpack) {
    modifiedConfig = reduceConfigsWithContext({
      initial: modifiedConfig,
      config: context.config.tools.webpack,
      ctx: utils,
      mergeFn: utils.mergeConfig,
    });
  }

  logger.debug('modify webpack config done');
  return modifiedConfig;
}

async function getChainUtils(
  target: RsbuildTarget,
  environment: EnvironmentContext,
): Promise<ModifyWebpackChainUtils> {
  const { default: webpack } = await import('webpack');
  const nameMap = {
    web: 'client',
    node: 'server',
    'web-worker': 'web-worker',
  };

  return {
    ...getBaseChainUtils(target, environment),
    name: nameMap[target] || '',
    webpack,
    HtmlWebpackPlugin: __internalHelper.getHTMLPlugin(),
  };
}

async function getConfigUtils(
  config: WebpackConfig,
  chainUtils: ModifyWebpackChainUtils,
): Promise<ModifyWebpackConfigUtils> {
  const { merge } = await import('@rsbuild/shared/webpack-merge');

  return {
    ...chainUtils,

    mergeConfig: merge,

    addRules(rules: RuleSetRule | RuleSetRule[]) {
      const ruleArr = castArray(rules);
      if (!config.module) {
        config.module = {};
      }
      if (!config.module.rules) {
        config.module.rules = [];
      }
      config.module.rules.unshift(...ruleArr);
    },

    prependPlugins(plugins: WebpackPluginInstance | WebpackPluginInstance[]) {
      const pluginArr = castArray(plugins);
      if (!config.plugins) {
        config.plugins = [];
      }
      config.plugins.unshift(...pluginArr);
    },

    appendPlugins(plugins: WebpackPluginInstance | WebpackPluginInstance[]) {
      const pluginArr = castArray(plugins);
      if (!config.plugins) {
        config.plugins = [];
      }
      config.plugins.push(...pluginArr);
    },

    removePlugin(pluginName: string) {
      if (config.plugins) {
        config.plugins = config.plugins.filter(
          (item) => item?.constructor.name !== pluginName,
        );
      }
    },
  };
}

export async function generateWebpackConfig({
  target,
  context,
  environment,
}: {
  environment: string;
  target: RsbuildTarget;
  context: InternalContext;
}): Promise<WebpackConfig> {
  const chainUtils = await getChainUtils(
    target,
    context.environments[environment],
  );
  const { default: webpack } = await import('webpack');
  const {
    BannerPlugin,
    DefinePlugin,
    IgnorePlugin,
    ProvidePlugin,
    HotModuleReplacementPlugin,
  } = webpack;

  const bundlerChain = await modifyBundlerChain(context, {
    ...chainUtils,
    bundler: {
      BannerPlugin,
      DefinePlugin,
      IgnorePlugin,
      ProvidePlugin,
      HotModuleReplacementPlugin,
    },
  });

  const chain = await modifyWebpackChain(context, chainUtils, bundlerChain);

  let webpackConfig = chainToConfig(chain) as WebpackConfig;

  webpackConfig = await modifyWebpackConfig(
    context,
    webpackConfig,
    await getConfigUtils(webpackConfig, chainUtils),
  );

  return webpackConfig;
}
