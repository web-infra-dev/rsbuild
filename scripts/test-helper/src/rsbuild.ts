import type {
  RspackConfig,
  RsbuildProvider,
  RsbuildPlugin,
  RsbuildInstance,
  CreateRsbuildOptions,
  BundlerPluginInstance,
} from '@rsbuild/shared';

const getRspackProvider = async () => {
  const { rspackProvider } = await import('@rsbuild/core/provider');
  return rspackProvider;
};

export const getRsbuildPlugins = async () => {
  const { plugins } = await import('@rsbuild/core/plugins/index');
  return plugins;
};

export function baseMatchLoader({
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
const matchPlugin = (config: RspackConfig, pluginName: string) => {
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
  Pick<
    RsbuildInstance,
    | 'build'
    | 'createCompiler'
    | 'inspectConfig'
    | 'startDevServer'
    | 'context'
    | 'addPlugins'
    | 'removePlugins'
    | 'isPluginExists'
    | 'initConfigs'
  > & {
    unwrapConfig: () => Promise<Record<string, any>>;
    matchLoader: (loader: string, testFile: string) => Promise<boolean>;
    matchBundlerPlugin: (name: string) => Promise<BundlerPluginInstance | null>;
  }
> {
  const { pick, createPluginStore } = await import('@rsbuild/shared');
  const rsbuildOptions: Required<CreateRsbuildOptions> = {
    cwd: process.env.REBUILD_TEST_SUITE_CWD || process.cwd(),
    rsbuildConfig,
    ...options,
  };

  // mock default entry
  if (!rsbuildConfig.source?.entry) {
    rsbuildConfig.source ||= {};
    rsbuildConfig.source.entry = {
      index: './src/index.js',
    };
  }

  const provider = (
    rsbuildConfig.provider ? rsbuildConfig.provider : await getRspackProvider()
  ) as RsbuildProvider;

  const pluginStore = createPluginStore();
  const {
    build,
    publicContext,
    inspectConfig,
    createCompiler,
    startDevServer,
    applyDefaultPlugins,
    initConfigs,
  } = await provider({
    pluginStore,
    rsbuildOptions,
    plugins: await getRsbuildPlugins(),
  });

  if (plugins) {
    pluginStore.addPlugins(plugins);
  } else {
    await applyDefaultPlugins(pluginStore);
  }

  const unwrapConfig = async () => {
    const configs = await initConfigs();
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
    ...pick(pluginStore, ['addPlugins', 'removePlugins', 'isPluginExists']),
    build,
    createCompiler,
    inspectConfig,
    startDevServer,
    context: publicContext,
    matchLoader,
    initConfigs,
    unwrapConfig,
    matchBundlerPlugin,
  };
}
