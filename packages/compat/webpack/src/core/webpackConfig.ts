import {
  debug,
  CHAIN_ID,
  castArray,
  chainToConfig,
  modifyBundlerChain,
  mergeChainedOptions,
  type NodeEnv,
  type BundlerChain,
  type RsbuildTarget,
  type WebpackChain,
  type ModifyWebpackChainUtils,
  type ModifyWebpackConfigUtils,
} from '@rsbuild/shared';
import type { InternalContext } from '@rsbuild/core/provider';
import { getCompiledPath } from '../shared';
import type { RuleSetRule, WebpackPluginInstance } from 'webpack';
import type { WebpackConfig } from '../types';

async function modifyWebpackChain(
  context: InternalContext,
  utils: ModifyWebpackChainUtils,
  chain: WebpackChain,
): Promise<WebpackChain> {
  debug('modify webpack chain');

  const [modifiedChain] = await context.hooks.modifyWebpackChain.call(
    chain,
    utils,
  );

  if (context.config.tools?.webpackChain) {
    castArray(context.config.tools.webpackChain).forEach((item) => {
      item(modifiedChain, utils);
    });
  }

  debug('modify webpack chain done');

  return modifiedChain;
}

async function modifyWebpackConfig(
  context: InternalContext,
  webpackConfig: WebpackConfig,
  utils: ModifyWebpackConfigUtils,
): Promise<WebpackConfig> {
  debug('modify webpack config');
  let [modifiedConfig] = await context.hooks.modifyWebpackConfig.call(
    webpackConfig,
    utils,
  );

  if (context.config.tools?.webpack) {
    modifiedConfig = mergeChainedOptions({
      defaults: modifiedConfig,
      options: context.config.tools.webpack,
      utils,
      mergeFn: utils.mergeConfig,
    });
  }

  debug('modify webpack config done');
  return modifiedConfig;
}

async function getChainUtils(
  target: RsbuildTarget,
): Promise<ModifyWebpackChainUtils> {
  const { default: webpack } = await import('webpack');
  const { getHTMLPlugin } = await import('@rsbuild/core/provider');
  const HtmlPlugin = getHTMLPlugin();

  const nodeEnv = process.env.NODE_ENV as NodeEnv;

  const nameMap = {
    web: 'client',
    node: 'server',
    'web-worker': 'web-worker',
    'service-worker': 'service-worker',
  };

  return {
    env: nodeEnv,
    name: nameMap[target] || '',
    target,
    webpack,
    isProd: nodeEnv === 'production',
    isServer: target === 'node',
    isServiceWorker: target === 'service-worker',
    isWebWorker: target === 'web-worker',
    CHAIN_ID,
    getCompiledPath,
    HtmlPlugin,
    HtmlWebpackPlugin: HtmlPlugin,
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
}: {
  target: RsbuildTarget;
  context: InternalContext;
}) {
  const chainUtils = await getChainUtils(target);
  const {
    BannerPlugin,
    DefinePlugin,
    ProvidePlugin,
    HotModuleReplacementPlugin,
  } = await import('webpack');

  const bundlerChain = await modifyBundlerChain(context, {
    ...chainUtils,
    bundler: {
      BannerPlugin,
      DefinePlugin,
      ProvidePlugin,
      HotModuleReplacementPlugin,
    },
  });

  const chain = await modifyWebpackChain(
    context,
    chainUtils,
    // module rules not support merge
    // need a special rule merge or use bundlerChain as WebpackChain
    bundlerChain as unknown as WebpackChain,
  );

  let webpackConfig = chainToConfig(
    chain as unknown as BundlerChain,
  ) as WebpackConfig;

  webpackConfig = await modifyWebpackConfig(
    context,
    webpackConfig,
    await getConfigUtils(webpackConfig, chainUtils),
  );

  return webpackConfig;
}
