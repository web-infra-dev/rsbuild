import {
  pick,
  createPluginStore,
  applyDefaultBuilderOptions,
  type CreateBuilderOptions,
} from '@rsbuild/shared';
import type { BuilderPlugin, BuilderConfig, WebpackConfig } from '@/types';
import assert from 'assert';
import { builderWebpackProvider } from '@/provider';
import type webpack from 'webpack';

/**
 * Check if a file handled by specific loader.
 * @author yangxingyuan
 * @param {Configuration} config - The webpack config.
 * @param {string} loader - The name of loader.
 * @param {string}  testFile - The name of test file that will be handled by webpack.
 * @returns {boolean} The result of the match.
 */
export function matchLoader({
  config,
  loader,
  testFile,
}: {
  config: webpack.Configuration;
  loader: string;
  testFile: string;
}): boolean {
  if (!config.module?.rules) {
    return false;
  }
  return config.module.rules.some((rule) => {
    if (
      rule &&
      typeof rule === 'object' &&
      rule.test &&
      rule.test instanceof RegExp &&
      rule.test.test(testFile)
    ) {
      return (
        Array.isArray(rule.use) &&
        rule.use.some((useOptions) => {
          if (typeof useOptions === 'object' && useOptions !== null) {
            return useOptions.loader?.includes(loader);
          } else if (typeof useOptions === 'string') {
            return useOptions.includes(loader);
          }
          return false;
        })
      );
    }
    return false;
  });
}

export const getBuilderPlugins = async () => {
  const { plugins } = await import('@rsbuild/core/plugins/index');

  return plugins;
};

/** Match plugin by constructor name. */
export const matchPlugin = (config: WebpackConfig, pluginName: string) => {
  const result = config.plugins?.filter(
    (item) => item?.constructor.name === pluginName,
  );

  if (Array.isArray(result)) {
    return result[0] || null;
  } else {
    return result || null;
  }
};

/**
 * different with builder.createBuilder. support add custom plugins instead of applyDefaultPlugins.
 */
export async function createBuilder({
  builderConfig = {},
  plugins,
  ...options
}: CreateBuilderOptions & {
  builderConfig?: BuilderConfig;
  plugins?: BuilderPlugin[] | string;
}) {
  const builderOptions = applyDefaultBuilderOptions(options);

  const provider = builderWebpackProvider({
    builderConfig,
  });

  const pluginStore = createPluginStore();
  const {
    build,
    initConfigs,
    publicContext,
    inspectConfig,
    createCompiler,
    startDevServer,
    applyDefaultPlugins,
  } = await provider({
    pluginStore,
    builderOptions,
    plugins: await getBuilderPlugins(),
  });

  if (plugins && typeof plugins !== 'string') {
    pluginStore.addPlugins(plugins);
  } else {
    await applyDefaultPlugins(pluginStore);
  }

  /** Unwrap webpack configs. */
  const unwrapWebpackConfigs = async () => {
    const webpackConfigs = await initConfigs();
    return webpackConfigs;
  };

  /** Unwrap webpack config, it will ensure there's only one config object. */
  const unwrapWebpackConfig = async () => {
    const webpackConfigs = await unwrapWebpackConfigs();
    assert(webpackConfigs.length === 1);
    return webpackConfigs[0];
  };

  /** Match webpack plugin by constructor name. */
  const matchWebpackPlugin = async (pluginName: string) => {
    const config = await unwrapWebpackConfig();
    const result = config.plugins?.filter(
      (item) => item?.constructor.name === pluginName,
    );
    if (Array.isArray(result)) {
      assert(result.length <= 1);
      return result[0] || null;
    } else {
      return result || null;
    }
  };

  /** Check if a file handled by specific loader. */
  const matchWebpackLoader = async (loader: string, testFile: string) =>
    matchLoader({ config: await unwrapWebpackConfig(), loader, testFile });

  return {
    ...pick(pluginStore, ['addPlugins', 'removePlugins', 'isPluginExists']),
    build,
    createCompiler,
    inspectConfig,
    startDevServer,
    unwrapWebpackConfig,
    unwrapWebpackConfigs,
    matchWebpackPlugin,
    matchWebpackLoader,
    context: publicContext,
  };
}

export const createStubBuilder = createBuilder;
