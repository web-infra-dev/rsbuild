import {
  pick,
  debug,
  createPluginStore,
  type RsbuildInstance,
  type RsbuildProvider,
  type CreateRsbuildOptions,
} from '@rsbuild/shared';
import { plugins } from './plugins';

const getRspackProvider = async () => {
  const { rspackProvider } = await import('./provider');
  return rspackProvider;
};

export async function createRsbuild(
  options: CreateRsbuildOptions,
): Promise<RsbuildInstance> {
  const { rsbuildConfig = {} } = options;

  const provider = (rsbuildConfig.provider ||
    (await getRspackProvider())) as RsbuildProvider;

  const rsbuildOptions: Required<CreateRsbuildOptions> = {
    cwd: process.cwd(),
    rsbuildConfig,
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
    getServerAPIs,
    startDevServer,
    applyDefaultPlugins,
  } = await provider({
    plugins,
    pluginStore,
    rsbuildOptions,
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
    getServerAPIs,
    startDevServer,
    context: publicContext,
  };

  if (rsbuildConfig.plugins) {
    rsbuild.addPlugins(rsbuildConfig.plugins);
  }

  return rsbuild;
}
