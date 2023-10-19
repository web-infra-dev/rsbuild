import {
  pick,
  debug,
  createPluginStore,
  applyDefaultBuilderOptions,
  type BuilderInstance,
  type BuilderProvider,
  type CreateBuilderOptions,
} from '@rsbuild/shared';
import { plugins } from './plugins';
import type { BuilderConfig } from './rspack-provider';

const getRspackProvider = async (builderConfig: BuilderConfig) => {
  const { rspackProvider } = await import('./rspack-provider');

  return rspackProvider({
    builderConfig,
  });
};

export async function createBuilder<
  P extends ({ builderConfig }: { builderConfig: T }) => BuilderProvider,
  T = BuilderConfig,
>(
  options: CreateBuilderOptions & {
    builderConfig: T;
    provider?: P;
  },
): Promise<BuilderInstance<ReturnType<P>>> {
  const { builderConfig } = options;

  const provider = options.provider
    ? options.provider({ builderConfig })
    : await getRspackProvider(builderConfig as BuilderConfig);

  const builderOptions = applyDefaultBuilderOptions(options);
  const pluginStore = createPluginStore();
  const {
    build,
    serve,
    pluginAPI,
    publicContext,
    initConfigs,
    inspectConfig,
    createCompiler,
    startDevServer,
    applyDefaultPlugins,
  } = await provider({
    pluginStore,
    builderOptions,
    plugins,
  });

  debug('add default plugins');
  await applyDefaultPlugins(pluginStore);
  debug('add default plugins done');

  return {
    ...pick(pluginStore, ['addPlugins', 'removePlugins', 'isPluginExists']),
    ...pick(pluginAPI, [
      'onBeforeBuild',
      'onBeforeCreateCompiler',
      'onBeforeStartDevServer',
      'onAfterBuild',
      'onAfterCreateCompiler',
      'onAfterStartDevServer',
      'onDevCompileDone',
      'onExit',
      'getHTMLPaths',
      'getBuilderConfig',
      'getNormalizedConfig',
    ]),
    serve,
    build,
    createCompiler,
    initConfigs,
    inspectConfig,
    startDevServer,
    context: publicContext,
  };
}
