import {
  type PluginManager,
  type PreviewServerOptions,
  logger,
} from '@rsbuild/shared';
import { createContext } from './createContext';
import { pick } from './helpers';
import { getPluginAPI } from './initPlugins';
import { initRsbuildConfig } from './internal';
import { setCssExtractPlugin } from './pluginHelper';
import { createPluginManager } from './pluginManager';
import type {
  CreateRsbuildOptions,
  InternalContext,
  RsbuildConfig,
  RsbuildInstance,
  RsbuildProvider,
} from './types';

const getRspackProvider = async () => {
  const { rspackProvider } = await import('./provider/provider');
  return rspackProvider;
};

async function applyDefaultPlugins(
  pluginManager: PluginManager,
  context: InternalContext,
) {
  const { pluginBasic } = await import('./plugins/basic');
  const { pluginEntry } = await import('./plugins/entry');
  const { pluginCache } = await import('./plugins/cache');
  const { pluginTarget } = await import('./plugins/target');
  const { pluginOutput } = await import('./plugins/output');
  const { pluginResolve } = await import('./plugins/resolve');
  const { pluginFileSize } = await import('./plugins/fileSize');
  const { pluginCleanOutput } = await import('./plugins/cleanOutput');
  const { pluginAsset } = await import('./plugins/asset');
  const { pluginHtml } = await import('./plugins/html');
  const { pluginWasm } = await import('./plugins/wasm');
  const { pluginMoment } = await import('./plugins/moment');
  const { pluginNodeAddons } = await import('./plugins/nodeAddons');
  const { pluginDefine } = await import('./plugins/define');
  const { pluginCss } = await import('./plugins/css');
  const { pluginMinimize } = await import('./plugins/minimize');
  const { pluginProgress } = await import('./plugins/progress');
  const { pluginSwc } = await import('./plugins/swc');
  const { pluginExternals } = await import('./plugins/externals');
  const { pluginSplitChunks } = await import('./plugins/splitChunks');
  const { pluginOpen } = await import('./plugins/open');
  const { pluginInlineChunk } = await import('./plugins/inlineChunk');
  const { pluginBundleAnalyzer } = await import('./plugins/bundleAnalyzer');
  const { pluginRsdoctor } = await import('./plugins/rsdoctor');
  const { pluginResourceHints } = await import('./plugins/resourceHints');
  const { pluginPerformance } = await import('./plugins/performance');
  const { pluginServer } = await import('./plugins/server');
  const { pluginManifest } = await import('./plugins/manifest');
  const { pluginModuleFederation } = await import('./plugins/moduleFederation');
  const { pluginRspackProfile } = await import('./plugins/rspackProfile');
  const { pluginLazyCompilation } = await import('./plugins/lazyCompilation');
  const { pluginSri } = await import('./plugins/sri');
  const { pluginNonce } = await import('./plugins/nonce');

  pluginManager.addPlugins([
    pluginBasic(),
    pluginEntry(),
    pluginCache(),
    pluginTarget(),
    pluginOutput(),
    pluginResolve(),
    pluginFileSize(),
    // cleanOutput plugin should before the html plugin
    pluginCleanOutput(),
    pluginAsset(),
    pluginHtml(async (...args) => {
      const result = await context.hooks.modifyHTMLTags.call(...args);
      return result[0];
    }),
    pluginWasm(),
    pluginMoment(),
    pluginNodeAddons(),
    pluginDefine(),
    pluginCss(),
    pluginMinimize(),
    pluginProgress(),
    pluginSwc(),
    pluginExternals(),
    pluginSplitChunks(),
    pluginOpen(),
    pluginInlineChunk(),
    pluginBundleAnalyzer(),
    pluginRsdoctor(),
    pluginResourceHints(),
    pluginPerformance(),
    pluginServer(),
    pluginManifest(),
    pluginModuleFederation(),
    pluginRspackProfile(),
    pluginLazyCompilation(),
    pluginSri(),
    pluginNonce(),
  ]);
}

/**
 * Omit unused keys from Rsbuild config passed by user
 */
export const pickRsbuildConfig = (
  rsbuildConfig: RsbuildConfig,
): RsbuildConfig => {
  const keys: Array<keyof RsbuildConfig> = [
    'dev',
    'html',
    'tools',
    'output',
    'source',
    'server',
    'security',
    'performance',
    'moduleFederation',
    'environments',
    '_privateMeta',
  ];
  return pick(rsbuildConfig, keys);
};

export async function createRsbuild(
  options: CreateRsbuildOptions = {},
): Promise<RsbuildInstance> {
  const { rsbuildConfig = {} } = options;

  const rsbuildOptions: Required<CreateRsbuildOptions> = {
    cwd: process.cwd(),
    rsbuildConfig,
    ...options,
  };

  const pluginManager = createPluginManager();

  const context = await createContext(
    rsbuildOptions,
    pickRsbuildConfig(rsbuildOptions.rsbuildConfig),
    rsbuildConfig.provider ? 'webpack' : 'rspack',
  );

  const pluginAPI = getPluginAPI({ context, pluginManager });
  context.pluginAPI = pluginAPI;

  logger.debug('add default plugins');
  await applyDefaultPlugins(pluginManager, context);
  logger.debug('add default plugins done');

  const provider = (rsbuildConfig.provider ||
    (await getRspackProvider())) as RsbuildProvider;

  const providerInstance = await provider({
    context,
    pluginManager,
    rsbuildOptions,
    setCssExtractPlugin,
  });

  const preview = async (options?: PreviewServerOptions) => {
    const { startProdServer } = await import('./server/prodServer');
    const config = await initRsbuildConfig({ context, pluginManager });
    return startProdServer(context, config, options);
  };

  const rsbuild = {
    ...pick(pluginManager, [
      'addPlugins',
      'getPlugins',
      'removePlugins',
      'isPluginExists',
    ]),
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
    ...pick(providerInstance, [
      'build',
      'initConfigs',
      'inspectConfig',
      'createCompiler',
      'createDevServer',
      'startDevServer',
    ]),
    preview,
    context: pluginAPI.context,
  };

  if (rsbuildConfig.plugins) {
    const plugins = await Promise.all(rsbuildConfig.plugins);
    rsbuild.addPlugins(plugins);
  }

  return rsbuild;
}
