import {
  pick,
  debug,
  type RsbuildInstance,
  type RsbuildProvider,
  type CreateRsbuildOptions,
} from '@rsbuild/shared';
import { plugins } from './plugins';
import { createPluginManager } from './pluginManager';

const getRspackProvider = async () => {
  const { rspackProvider } = await import('./provider/provider');
  return rspackProvider;
};

export async function createRsbuild(
  options: CreateRsbuildOptions = {},
): Promise<RsbuildInstance> {
  const { rsbuildConfig = {} } = options;

  const provider = (rsbuildConfig.provider ||
    (await getRspackProvider())) as RsbuildProvider;

  const rsbuildOptions: Required<CreateRsbuildOptions> = {
    cwd: process.cwd(),
    rsbuildConfig,
    ...options,
  };

  const pluginManager = createPluginManager();
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
    plugins,
    pluginManager,
    rsbuildOptions,
  });

  debug('add default plugins');
  await applyDefaultPlugins(pluginManager);
  debug('add default plugins done');

  const rsbuild = {
    ...pick(pluginManager, ['addPlugins', 'removePlugins', 'isPluginExists']),
    ...pick(pluginAPI, [
      'onBeforeBuild',
      'onBeforeCreateCompiler',
      'onBeforeStartDevServer',
      'onBeforeStartProdServer',
      'onAfterBuild',
      'onAfterCreateCompiler',
      'onAfterStartDevServer',
      'onAfterStartProdServer',
      'onCloseDevServer',
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
    const plugins = await Promise.all(rsbuildConfig.plugins);
    rsbuild.addPlugins(plugins);
  }

  return rsbuild;
}
