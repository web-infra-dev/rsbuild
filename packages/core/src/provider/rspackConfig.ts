import { rspack } from '@rspack/core';
import { reduceConfigsAsyncWithContext } from 'reduce-configs';
import { merge } from 'webpack-merge';
import { CHAIN_ID, modifyBundlerChain } from '../configChain';
import { castArray, color, getNodeEnv } from '../helpers';
import { logger } from '../logger';
import { getHTMLPlugin } from '../pluginHelper';
import type {
  EnvironmentContext,
  InternalContext,
  ModifyChainUtils,
  ModifyRspackConfigUtils,
  RsbuildTarget,
  Rspack,
} from '../types';

async function modifyRspackConfig(
  context: InternalContext,
  rspackConfig: Rspack.Configuration,
  chainUtils: ModifyChainUtils,
) {
  logger.debug('modify Rspack config');

  let currentConfig = rspackConfig;

  // Ensure the helpers can always access the latest merged configuration object
  const proxiedConfig = new Proxy(
    {},
    {
      get(_, prop) {
        return currentConfig[prop as keyof typeof currentConfig];
      },
      set(_, prop, value) {
        currentConfig[prop as keyof typeof currentConfig] = value;
        return true;
      },
    },
  );

  const utils = await getConfigUtils(proxiedConfig, chainUtils);

  [currentConfig] = await context.hooks.modifyRspackConfig.callChain({
    environment: utils.environment.name,
    args: [rspackConfig, utils],
  });

  if (utils.environment.config.tools?.rspack) {
    currentConfig = await reduceConfigsAsyncWithContext({
      initial: currentConfig,
      config: utils.environment.config.tools.rspack,
      ctx: utils,
      mergeFn: (...args: Rspack.Configuration[]) => {
        // Update the reference of the current config
        currentConfig = utils.mergeConfig.call(utils, args);
        return currentConfig;
      },
    });
  }

  logger.debug('modify Rspack config done');
  return currentConfig;
}

export async function getConfigUtils(
  config: Rspack.Configuration,
  chainUtils: ModifyChainUtils,
): Promise<ModifyRspackConfigUtils> {
  return {
    ...chainUtils,

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

    appendRules(rules) {
      const ruleArr = castArray(rules);
      if (!config.module) {
        config.module = {};
      }
      if (!config.module.rules) {
        config.module.rules = [];
      }
      config.module.rules.push(...ruleArr);
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
    rspack,
    environment,
    env: nodeEnv,
    target,
    isDev: environment.config.mode === 'development',
    isProd: environment.config.mode === 'production',
    isServer: target === 'node',
    isWebWorker: target === 'web-worker',
    CHAIN_ID,
    HtmlPlugin: getHTMLPlugin(),
  };
}

function validateRspackConfig(config: Rspack.Configuration) {
  // validate plugins
  if (config.plugins) {
    for (const plugin of config.plugins) {
      if (
        plugin &&
        plugin.apply === undefined &&
        'name' in plugin &&
        'setup' in plugin
      ) {
        const name = color.bold(color.yellow(plugin.name));
        throw new Error(
          `[rsbuild:plugin] "${name}" appears to be an Rsbuild plugin. It cannot be used as an Rspack plugin.`,
        );
      }
    }
  }

  if (config.devServer) {
    logger.warn(
      `[rsbuild:config] Find invalid Rspack config: "${color.yellow('devServer')}". Note that Rspack's "devServer" config is not supported by Rsbuild. You can use Rsbuild's "dev" config to configure the Rsbuild dev server.`,
    );
  }
}

export async function generateRspackConfig({
  target,
  context,
  environment,
}: {
  environment: string;
  target: RsbuildTarget;
  context: InternalContext;
}): Promise<Rspack.Configuration> {
  const chainUtils = getChainUtils(target, context.environments[environment]);
  const {
    BannerPlugin,
    DefinePlugin,
    IgnorePlugin,
    ProvidePlugin,
    SourceMapDevToolPlugin,
    HotModuleReplacementPlugin,
  } = rspack;

  const chain = await modifyBundlerChain(context, {
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

  let rspackConfig = chain.toConfig();

  rspackConfig = await modifyRspackConfig(context, rspackConfig, chainUtils);

  validateRspackConfig(rspackConfig);

  return rspackConfig;
}
