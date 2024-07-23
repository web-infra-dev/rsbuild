import { createContext } from './createContext';
import { pick } from './helpers';
import { initPluginAPI } from './initPlugins';
import { initRsbuildConfig } from './internal';
import { logger } from './logger';
import { setCssExtractPlugin } from './pluginHelper';
import { createPluginManager } from './pluginManager';
import type {
  CreateRsbuildOptions,
  InternalContext,
  PluginManager,
  PreviewServerOptions,
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
  const plugins = await Promise.all([
    import('./plugins/basic').then(({ pluginBasic }) => pluginBasic()),
    import('./plugins/entry').then(({ pluginEntry }) => pluginEntry()),
    import('./plugins/cache').then(({ pluginCache }) => pluginCache()),
    import('./plugins/target').then(({ pluginTarget }) => pluginTarget()),
    import('./plugins/output').then(({ pluginOutput }) => pluginOutput()),
    import('./plugins/resolve').then(({ pluginResolve }) => pluginResolve()),
    import('./plugins/fileSize').then(({ pluginFileSize }) => pluginFileSize()),
    // cleanOutput plugin should before the html plugin
    import('./plugins/cleanOutput').then(({ pluginCleanOutput }) =>
      pluginCleanOutput(),
    ),
    import('./plugins/asset').then(({ pluginAsset }) => pluginAsset()),
    import('./plugins/html').then(({ pluginHtml }) =>
      pluginHtml((environment: string) => async (...args) => {
        const result = await context.hooks.modifyHTMLTags.callInEnvironment({
          environment,
          args,
        });
        return result[0];
      }),
    ),
    import('./plugins/appIcon').then(({ pluginAppIcon }) => pluginAppIcon()),
    import('./plugins/wasm').then(({ pluginWasm }) => pluginWasm()),
    import('./plugins/moment').then(({ pluginMoment }) => pluginMoment()),
    import('./plugins/nodeAddons').then(({ pluginNodeAddons }) =>
      pluginNodeAddons(),
    ),
    import('./plugins/define').then(({ pluginDefine }) => pluginDefine()),
    import('./plugins/css').then(({ pluginCss }) => pluginCss()),
    import('./plugins/minimize').then(({ pluginMinimize }) => pluginMinimize()),
    import('./plugins/progress').then(({ pluginProgress }) => pluginProgress()),
    import('./plugins/swc').then(({ pluginSwc }) => pluginSwc()),
    import('./plugins/externals').then(({ pluginExternals }) =>
      pluginExternals(),
    ),
    import('./plugins/splitChunks').then(({ pluginSplitChunks }) =>
      pluginSplitChunks(),
    ),
    import('./plugins/open').then(({ pluginOpen }) => pluginOpen()),
    import('./plugins/inlineChunk').then(({ pluginInlineChunk }) =>
      pluginInlineChunk(),
    ),
    import('./plugins/rsdoctor').then(({ pluginRsdoctor }) => pluginRsdoctor()),
    import('./plugins/resourceHints').then(({ pluginResourceHints }) =>
      pluginResourceHints(),
    ),
    import('./plugins/performance').then(({ pluginPerformance }) =>
      pluginPerformance(),
    ),
    import('./plugins/bundleAnalyzer').then(({ pluginBundleAnalyzer }) =>
      pluginBundleAnalyzer(),
    ),
    import('./plugins/server').then(({ pluginServer }) => pluginServer()),
    import('./plugins/manifest').then(({ pluginManifest }) => pluginManifest()),
    import('./plugins/moduleFederation').then(({ pluginModuleFederation }) =>
      pluginModuleFederation(),
    ),
    import('./plugins/rspackProfile').then(({ pluginRspackProfile }) =>
      pluginRspackProfile(),
    ),
    import('./plugins/lazyCompilation').then(({ pluginLazyCompilation }) =>
      pluginLazyCompilation(),
    ),
    import('./plugins/sri').then(({ pluginSri }) => pluginSri()),
    import('./plugins/nonce').then(({ pluginNonce }) => pluginNonce()),
  ]);

  pluginManager.addPlugins(plugins);
}

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
    rsbuildOptions.rsbuildConfig,
    rsbuildConfig.provider ? 'webpack' : 'rspack',
  );

  const getPluginAPI = initPluginAPI({ context, pluginManager });
  context.getPluginAPI = getPluginAPI;
  const globalPluginAPI = getPluginAPI();

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
    ...pick(globalPluginAPI, [
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
    context: globalPluginAPI.context,
  };

  if (rsbuildConfig.plugins) {
    const plugins = await Promise.all(rsbuildConfig.plugins);
    rsbuild.addPlugins(plugins);
  }

  // Register environment plugin
  if (rsbuildConfig.environments) {
    await Promise.all(
      Object.entries(rsbuildConfig.environments).map(async ([name, config]) => {
        if (config.plugins) {
          const plugins = await Promise.all(config.plugins);
          rsbuild.addPlugins(plugins, {
            environment: name,
          });
        }
      }),
    );
  }

  return rsbuild;
}
