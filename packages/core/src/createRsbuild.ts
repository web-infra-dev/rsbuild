import {
  pick,
  debug,
  createPluginStore,
  type RsbuildInstance,
  type RsbuildProvider,
  type CreateRsbuildOptions,
} from '@rsbuild/shared';
import { plugins } from './plugins';
import type { RsbuildConfig } from './rspack-provider';

const getRspackProvider = async (rsbuildConfig: RsbuildConfig) => {
  const { rspackProvider } = await import('./rspack-provider');

  return rspackProvider({
    rsbuildConfig,
  });
};

export const getCreateRsbuildDefaultOptions =
  (): Required<CreateRsbuildOptions> => ({
    cwd: process.cwd(),
    entry: {},
    target: ['web'],
    configPath: null,
  });

export async function createRsbuild<
  P extends ({ rsbuildConfig }: { rsbuildConfig: T }) => RsbuildProvider,
  T = RsbuildConfig,
>(
  options: CreateRsbuildOptions & {
    rsbuildConfig: T;
    provider?: P;
  },
): Promise<RsbuildInstance<ReturnType<P>>> {
  const { rsbuildConfig } = options;

  const provider = options.provider
    ? options.provider({ rsbuildConfig })
    : await getRspackProvider(rsbuildConfig as RsbuildConfig);

  const rsbuildOptions = {
    ...getCreateRsbuildDefaultOptions(),
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
    build,
    preview,
    createCompiler,
    initConfigs,
    inspectConfig,
    startDevServer,
    context: publicContext,
  };
}
