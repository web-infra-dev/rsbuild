import {
  pick,
  debug,
  createPluginStore,
  type RsbuildInstance,
  type RsbuildProvider,
  type CreateRsbuildOptions,
} from '@rsbuild/shared';
import { plugins } from './plugins';
import type { RsbuildConfig } from './types';

const getRspackProvider = async (rsbuildConfig: RsbuildConfig) => {
  const { rspackProvider } = await import('./provider');
  return rspackProvider({
    rsbuildConfig,
  });
};

export async function createRsbuild(
  options: CreateRsbuildOptions & {
    rsbuildConfig: RsbuildConfig;
    provider?: ({
      rsbuildConfig,
    }: {
      rsbuildConfig: RsbuildConfig;
    }) => RsbuildProvider;
  },
): Promise<RsbuildInstance> {
  const { rsbuildConfig } = options;

  const provider = options.provider
    ? options.provider({ rsbuildConfig })
    : await getRspackProvider(rsbuildConfig as RsbuildConfig);

  const rsbuildOptions: Required<CreateRsbuildOptions> = {
    cwd: process.cwd(),
    ...options,
  };

  const pluginStore = createPluginStore();
  const {
    build,
    preview,
    pluginAPI,
    publicContext,
    initConfigs,
    inspectConfig,
    createCompiler,
    createDevServer,
    startDevServer,
    applyDefaultPlugins,
  } = await provider({
    pluginStore,
    rsbuildOptions,
    plugins,
  });

  debug('add default plugins');
  await applyDefaultPlugins(pluginStore);
  debug('add default plugins done');

  const rsbuild = {
    ...pick(pluginStore, ['addPlugins', 'removePlugins', 'isPluginExists']),
    ...pick(pluginAPI, [
      'onBeforeBuild',
      'onBeforeCreateCompiler',
      'onBeforeStartDevServer',
      'onBeforeStartProdServer',
      'onAfterBuild',
      'onAfterCreateCompiler',
      'onAfterStartDevServer',
      'onAfterStartProdServer',
      'onDevCompileDone',
      'onExit',
      'getHTMLPaths',
      'getRsbuildConfig',
      'getNormalizedConfig',
    ]),
    build,
    preview,
    createCompiler,
    initConfigs,
    inspectConfig,
    createDevServer,
    startDevServer,
    context: publicContext,
  };

  if (rsbuildConfig.plugins) {
    rsbuild.addPlugins(rsbuildConfig.plugins);
  }

  return rsbuild;
}
