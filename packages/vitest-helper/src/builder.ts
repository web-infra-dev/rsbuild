import type {
  RsbuildProvider,
  RsbuildPlugin,
  BundlerConfig,
  RsbuildInstance,
  CreateRsbuildOptions,
} from '@rsbuild/shared';
import type { RsbuildConfig } from '@rsbuild/core/rspack-provider';

const getRspackProvider = async (builderConfig: RsbuildConfig) => {
  const { rspackProvider } = await import('@rsbuild/core/rspack-provider');

  return rspackProvider({
    builderConfig,
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
  P extends ({ builderConfig }: { builderConfig: T }) => RsbuildProvider,
  T,
>({
  builderConfig = {} as T,
  plugins,
  ...options
}: CreateRsbuildOptions & {
  builderConfig?: T;
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
  >
> {
  const { pick, createPluginStore, applyDefaultRsbuildOptions } = await import(
    '@rsbuild/shared'
  );
  const builderOptions = applyDefaultRsbuildOptions(options);

  const provider = options.provider
    ? options.provider({ builderConfig })
    : await getRspackProvider(builderConfig as RsbuildConfig);

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
    builderOptions,
    plugins: await getRsbuildPlugins(),
  });

  if (plugins) {
    pluginStore.addPlugins(plugins);
  } else {
    await applyDefaultPlugins(pluginStore);
  }

  return {
    ...pick(pluginStore, ['addPlugins', 'removePlugins', 'isPluginExists']),
    build,
    createCompiler,
    inspectConfig,
    startDevServer,
    context: publicContext,
    initConfigs,
  };
}
