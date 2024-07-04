import {
  type EnvironmentContext,
  type ModifyRspackConfigUtils,
  type ModifyWebpackChainUtils,
  type ModifyWebpackConfigUtils,
  type RsbuildTarget,
  type Rspack,
  type RspackChain,
  __internalHelper,
  logger,
} from '@rsbuild/core';
import { reduceConfigsWithContext } from 'reduce-configs';
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

  if (utils.environment.config.tools?.webpackChain) {
    for (const item of castArray(utils.environment.config.tools.webpackChain)) {
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

  if (utils.environment.config.tools?.webpack) {
    modifiedConfig = reduceConfigsWithContext({
      initial: modifiedConfig,
      config: utils.environment.config.tools.webpack,
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

  const configUtils = (await __internalHelper.getConfigUtils(
    webpackConfig as Rspack.Configuration,
    chainUtils as unknown as ModifyRspackConfigUtils,
  )) as unknown as ModifyWebpackConfigUtils;

  webpackConfig = await modifyWebpackConfig(
    context,
    webpackConfig,
    configUtils,
  );

  return webpackConfig;
}
