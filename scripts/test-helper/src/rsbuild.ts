import type {
  BundlerPluginInstance,
  CreateRsbuildOptions,
  RsbuildInstance,
  RsbuildPlugins,
  Rspack,
} from '@rsbuild/core';

/** Match plugin by constructor name. */
export const matchPlugin = (
  config: Rspack.Configuration,
  pluginName: string,
) => {
  const result = config.plugins?.filter(
    (item) => item?.constructor.name === pluginName,
  );

  if (Array.isArray(result)) {
    return result[0] || null;
  }
  return result || null;
};

/**
 * different with rsbuild createRsbuild. support add custom plugins instead of applyDefaultPlugins.
 */
export async function createStubRsbuild({
  rsbuildConfig = {},
  plugins,
  ...options
}: CreateRsbuildOptions & {
  plugins?: RsbuildPlugins;
}): Promise<
  RsbuildInstance & {
    unwrapConfig: () => Promise<Record<string, any>>;
    matchBundlerPlugin: (name: string) => Promise<BundlerPluginInstance | null>;
  }
> {
  const { createRsbuild } = await import('@rsbuild/core');
  const rsbuildOptions: Required<CreateRsbuildOptions> = {
    cwd: process.env.REBUILD_TEST_SUITE_CWD || process.cwd(),
    rsbuildConfig,
    ...options,
  };

  // mock default entry
  if (!rsbuildConfig.source?.entry && !rsbuildConfig.environments) {
    rsbuildConfig.source ||= {};
    rsbuildConfig.source.entry = {
      index: './src/index.js',
    };
  }

  const rsbuild = await createRsbuild(rsbuildOptions);

  if (plugins) {
    // remove all builtin plugins
    rsbuild.removePlugins(rsbuild.getPlugins().map((item) => item.name));
    rsbuild.addPlugins(await Promise.all(plugins));
  }

  const unwrapConfig = async (index = 0) => {
    const configs = await rsbuild.initConfigs();
    return configs[index];
  };

  /** Match rspack/webpack plugin by constructor name. */
  const matchBundlerPlugin = async (pluginName: string, index?: number) => {
    const config = await unwrapConfig(index);

    return matchPlugin(config, pluginName) as BundlerPluginInstance;
  };

  return {
    ...rsbuild,
    unwrapConfig,
    matchBundlerPlugin,
  };
}
