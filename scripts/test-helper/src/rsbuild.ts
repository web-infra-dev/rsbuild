import type {
  CreateRsbuildOptions,
  RsbuildInstance,
  RsbuildPlugin,
} from '@rsbuild/core';
import type { BundlerPluginInstance, RspackConfig } from '@rsbuild/shared';

function baseMatchLoader({
  config,
  loader,
  testFile,
}: {
  config: RspackConfig;
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
          }
          if (typeof useOptions === 'string') {
            return useOptions.includes(loader);
          }
          return false;
        })
      );
    }
    return false;
  });
}

/** Match plugin by constructor name. */
export const matchPlugin = (config: RspackConfig, pluginName: string) => {
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
  plugins?: RsbuildPlugin[];
}): Promise<
  RsbuildInstance & {
    unwrapConfig: () => Promise<Record<string, any>>;
    matchLoader: (loader: string, testFile: string) => Promise<boolean>;
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
    rsbuild.addPlugins(plugins);
  }

  const unwrapConfig = async () => {
    const configs = await rsbuild.initConfigs();
    return configs[0];
  };

  /** Match rspack/webpack plugin by constructor name. */
  const matchBundlerPlugin = async (pluginName: string) => {
    const config = await unwrapConfig();

    return matchPlugin(config, pluginName) as BundlerPluginInstance;
  };

  /** Check if a file handled by specific loader. */
  const matchLoader = async (loader: string, testFile: string) =>
    baseMatchLoader({ config: await unwrapConfig(), loader, testFile });

  return {
    ...rsbuild,
    matchLoader,
    unwrapConfig,
    matchBundlerPlugin,
  };
}
