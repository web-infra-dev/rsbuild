import {
  type CreateCompiler,
  type PreviewServerOptions,
  type RsbuildProvider,
  pickRsbuildConfig,
} from '@rsbuild/shared';
import { initConfigs } from './initConfigs';
import {
  createContext,
  createDevServer,
  createPublicContext,
  getPluginAPI,
  initRsbuildConfig,
  plugins,
  setCssExtractPlugin,
  startProdServer,
} from './shared';

export const webpackProvider: RsbuildProvider<'webpack'> = async ({
  pluginManager,
  rsbuildOptions,
}) => {
  const rsbuildConfig = pickRsbuildConfig(rsbuildOptions.rsbuildConfig);
  const context = await createContext(rsbuildOptions, rsbuildConfig, 'webpack');
  const pluginAPI = getPluginAPI({ context, pluginManager });

  context.pluginAPI = pluginAPI;

  const { default: cssExtractPlugin } = await import('mini-css-extract-plugin');
  setCssExtractPlugin(cssExtractPlugin);

  const createCompiler = (async () => {
    const { createCompiler } = await import('./createCompiler');
    const { webpackConfigs } = await initConfigs({
      context,
      pluginManager,
      rsbuildOptions,
    });
    return createCompiler({ context, webpackConfigs });
  }) as CreateCompiler;

  return {
    bundler: 'webpack',

    pluginAPI,

    createCompiler,

    publicContext: createPublicContext(context),

    async applyDefaultPlugins() {
      const allPlugins = await Promise.all([
        plugins.basic(),
        plugins.entry(),
        plugins.cache(),
        plugins.target(),
        plugins.output(),
        plugins.resolve(),
        plugins.fileSize(),
        plugins.cleanOutput(),
        plugins.asset(),
        plugins.html(async (tags) => {
          const result = await context.hooks.modifyHTMLTags.call(tags);
          return result[0];
        }),
        plugins.wasm(),
        plugins.moment(),
        plugins.nodeAddons(),
        plugins.define(),
        plugins.css(),
        plugins.sass(),
        plugins.bundleAnalyzer(),
        plugins.rsdoctor(),
        plugins.splitChunks(),
        plugins.startUrl(),
        plugins.inlineChunk(),
        plugins.externals(),
        plugins.performance(),
        plugins.resourceHints(),
        plugins.server(),
        plugins.moduleFederation(),
        plugins.manifest(),
        import('./plugin').then((m) => m.pluginAdaptor()),
      ]);

      pluginManager.addPlugins(allPlugins);
    },

    async initConfigs() {
      const { webpackConfigs } = await initConfigs({
        context,
        pluginManager,
        rsbuildOptions,
      });
      return webpackConfigs;
    },

    async createDevServer(options) {
      const { createDevMiddleware } = await import('./createCompiler');
      const config = await initRsbuildConfig({ context, pluginManager });
      return createDevServer(
        { context, pluginManager, rsbuildOptions },
        createDevMiddleware,
        config,
        options,
      );
    },

    async startDevServer(options) {
      const { createDevMiddleware } = await import('./createCompiler');
      const config = await initRsbuildConfig({
        context,
        pluginManager,
      });
      const server = await createDevServer(
        {
          context,
          pluginManager,
          rsbuildOptions,
        },
        createDevMiddleware,
        config,
        options,
      );

      return server.listen();
    },

    async preview(options?: PreviewServerOptions) {
      const config = await initRsbuildConfig({
        context,
        pluginManager,
      });
      return startProdServer(context, config, options);
    },

    async build(options) {
      const { build } = await import('./build');
      return build({ context, pluginManager, rsbuildOptions }, options);
    },

    async inspectConfig(inspectOptions) {
      const { inspectConfig } = await import('./inspectConfig');
      return await inspectConfig({
        context,
        pluginManager,
        rsbuildOptions,
        inspectOptions,
      });
    },
  };
};
