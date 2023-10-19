import {
  pick,
  debug,
  createPluginStore,
  applyDefaultRsbuildOptions,
  type RsbuildInstance,
  type RsbuildProvider,
  type CreateRsbuildOptions,
} from '@rsbuild/shared';
import { plugins } from './plugins';
import type { RsbuildConfig } from './rspack-provider';

const getRspackProvider = async (builderConfig: RsbuildConfig) => {
  const { rspackProvider } = await import('./rspack-provider');

  return rspackProvider({
    builderConfig,
  });
};

export async function createRsbuild<
  P extends ({ builderConfig }: { builderConfig: T }) => RsbuildProvider,
  T = RsbuildConfig,
>(
  options: CreateRsbuildOptions & {
    builderConfig: T;
    provider?: P;
  },
): Promise<RsbuildInstance<ReturnType<P>>> {
  const { builderConfig } = options;

  const provider = options.provider
    ? options.provider({ builderConfig })
    : await getRspackProvider(builderConfig as RsbuildConfig);

  const builderOptions = applyDefaultRsbuildOptions(options);
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
      'getRsbuildConfig',
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
