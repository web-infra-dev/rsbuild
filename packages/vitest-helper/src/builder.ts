import type {
  BuilderProvider,
  BuilderPlugin,
  BundlerConfig,
  BuilderInstance,
  CreateBuilderOptions,
} from '@rsbuild/shared';
import type { BuilderConfig } from '@rsbuild/core/rspack-provider';

const getRspackProvider = async (builderConfig: BuilderConfig) => {
  const { rspackProvider } = await import('@rsbuild/core/rspack-provider');

  return rspackProvider({
    builderConfig,
  });
};

export const getBuilderPlugins = async () => {
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
 * different with rsbuild createBuilder. support add custom plugins instead of applyDefaultPlugins.
 */
export async function createStubBuilder<
  P extends ({ builderConfig }: { builderConfig: T }) => BuilderProvider,
  T,
>({
  builderConfig = {} as T,
  plugins,
  ...options
}: CreateBuilderOptions & {
  builderConfig?: T;
  provider?: P;
  plugins?: BuilderPlugin[];
}): Promise<
  Pick<
    BuilderInstance<ReturnType<P>>,
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
  const { pick, createPluginStore, applyDefaultBuilderOptions } = await import(
    '@rsbuild/shared'
  );
  const builderOptions = applyDefaultBuilderOptions(options);

  const provider = options.provider
    ? options.provider({ builderConfig })
    : await getRspackProvider(builderConfig as BuilderConfig);

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
    plugins: await getBuilderPlugins(),
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
