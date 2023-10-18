import {
  pick,
  createPluginStore,
  applyDefaultBuilderOptions,
  type CreateBuilderOptions,
} from '@rsbuild/shared';
import type { BuilderPlugin, BuilderConfig, WebpackConfig } from '@/types';
import assert from 'assert';
import { builderWebpackProvider } from '@/provider';

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
  plugins?: BuilderPlugin[];
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

  if (plugins) {
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

  return {
    ...pick(pluginStore, ['addPlugins', 'removePlugins', 'isPluginExists']),
    build,
    createCompiler,
    inspectConfig,
    startDevServer,
    unwrapWebpackConfig,
    unwrapWebpackConfigs,
    context: publicContext,
  };
}

export const createStubBuilder = createBuilder;
