import type {
  RsbuildProvider,
  RsbuildPlugin,
  BundlerConfig,
  RsbuildInstance,
  CreateRsbuildOptions,
  BundlerPluginInstance,
} from '@rsbuild/shared';
import type { RsbuildConfig } from '@rsbuild/core';

const getRspackProvider = async (rsbuildConfig: RsbuildConfig) => {
  const { rspackProvider } = await import('@rsbuild/core/rspack-provider');

  return rspackProvider({
    rsbuildConfig,
  });
};

export const getRsbuildPlugins = async () => {
  const { plugins } = await import('@rsbuild/core/plugins/index');

  return plugins;
};

export function matchLoader({
  config,
  loader,
  testFile,
}: {
  config: BundlerConfig;
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

/** Match plugin by constructor name. */
export const matchPlugin = (config: BundlerConfig, pluginName: string) => {
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
 * different with rsbuild createRsbuild. support add custom plugins instead of applyDefaultPlugins.
 */
export async function createStubRsbuild<
  P extends ({ rsbuildConfig }: { rsbuildConfig: T }) => RsbuildProvider,
  T extends RsbuildConfig,
>({
  rsbuildConfig = {} as T,
  plugins,
  ...options
}: CreateRsbuildOptions & {
  rsbuildConfig?: T;
  provider?: P;
  plugins?: RsbuildPlugin[];
}): Promise<
  Pick<
    RsbuildInstance<ReturnType<P>>,
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
    matchBundlerPlugin: (name: string) => Promise<BundlerPluginInstance | null>;
  }
> {
  const { pick, createPluginStore } = await import('@rsbuild/shared');
  const rsbuildOptions: Required<CreateRsbuildOptions> = {
    cwd: process.cwd(),
    target: ['web'],
    ...options,
  };

  // mock default entry
  if (!rsbuildConfig.source?.entry) {
    rsbuildConfig.source ||= {};
    rsbuildConfig.source.entry = {
      index: './src/index.js',
    };
  }

  const provider = options.provider
    ? options.provider({ rsbuildConfig })
    : await getRspackProvider(rsbuildConfig as RsbuildConfig);

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

    return matchPlugin(config as BundlerConfig, pluginName);
  };

  return {
    ...pick(pluginStore, ['addPlugins', 'removePlugins', 'isPluginExists']),
    build,
    createCompiler,
    inspectConfig,
    startDevServer,
    context: publicContext,
    initConfigs,
    unwrapConfig,
    matchBundlerPlugin,
  };
}
