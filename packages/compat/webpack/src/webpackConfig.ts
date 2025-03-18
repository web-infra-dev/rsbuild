import {
  type EnvironmentContext,
  type InternalContext,
  type ModifyRspackConfigUtils,
  type ModifyWebpackChainUtils,
  type ModifyWebpackConfigUtils,
  type RsbuildProviderHelpers,
  type RsbuildTarget,
  type Rspack,
  type RspackChain,
  logger,
} from '@rsbuild/core';
import { reduceConfigsWithContext } from 'reduce-configs';
import { castArray } from './shared.js';
import type { WebpackConfig } from './types.js';

async function modifyWebpackChain(
  context: InternalContext,
  utils: ModifyWebpackChainUtils,
  chain: RspackChain,
): Promise<RspackChain> {
  logger.debug('modify webpack chain');

  const [modifiedChain] = await context.hooks.modifyWebpackChain.callChain({
    environment: utils.environment.name,
    args: [chain, utils],
  });

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
  let [modifiedConfig] = await context.hooks.modifyWebpackConfig.callChain({
    environment: utils.environment.name,
    args: [webpackConfig, utils],
  });

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
  helpers: RsbuildProviderHelpers,
): Promise<ModifyWebpackChainUtils> {
  const { default: webpack } = await import('webpack');
  const nameMap = {
    web: 'client',
    node: 'server',
    'web-worker': 'web-worker',
  };

  return {
    ...helpers.getChainUtils(target, environment),
    name: nameMap[target] || '',
    webpack,
    HtmlWebpackPlugin: helpers.getHTMLPlugin(),
  };
}

export async function generateWebpackConfig({
  target,
  context,
  environment,
  helpers,
}: {
  environment: string;
  target: RsbuildTarget;
  context: InternalContext;
  helpers: RsbuildProviderHelpers;
}): Promise<WebpackConfig> {
  const chainUtils = await getChainUtils(
    target,
    context.environments[environment],
    helpers,
  );
  const { default: webpack } = await import('webpack');
  const {
    BannerPlugin,
    DefinePlugin,
    IgnorePlugin,
    ProvidePlugin,
    SourceMapDevToolPlugin,
    HotModuleReplacementPlugin,
  } = webpack;

  const bundlerChain = await helpers.modifyBundlerChain(context, {
    ...chainUtils,
    bundler: {
      BannerPlugin,
      DefinePlugin,
      IgnorePlugin,
      ProvidePlugin,
      SourceMapDevToolPlugin,
      HotModuleReplacementPlugin,
    },
  });

  const chain = await modifyWebpackChain(context, chainUtils, bundlerChain);

  let webpackConfig = chain.toConfig() as WebpackConfig;

  const configUtils = (await helpers.getConfigUtils(
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
