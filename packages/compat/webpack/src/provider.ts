import {
  pickRsbuildConfig,
  type CreateCompiler,
  type RsbuildProvider,
  type PreviewServerOptions,
} from '@rsbuild/shared';
import {
  plugins,
  getPluginAPI,
  createContext,
  initRsbuildConfig,
  createPublicContext,
} from '@rsbuild/core/internal';
import { initConfigs } from './initConfigs';

export const webpackProvider: RsbuildProvider<'webpack'> = async ({
  pluginManager,
  rsbuildOptions,
}) => {
  const rsbuildConfig = pickRsbuildConfig(rsbuildOptions.rsbuildConfig);
  const context = await createContext(rsbuildOptions, rsbuildConfig, 'webpack');
  const pluginAPI = getPluginAPI({ context, pluginManager });

  context.pluginAPI = pluginAPI;

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
        plugins.basic?.(),
        plugins.entry?.(),
        plugins.cache?.(),
        plugins.target?.(),
        import('./plugins/output').then((m) => m.pluginOutput()),
        import('./plugins/resolve').then((m) => m.pluginResolve()),
        plugins.fileSize?.(),
        plugins.cleanOutput?.(),
        plugins.asset(),
        import('./plugins/copy').then((m) => m.pluginCopy()),
        plugins.html(async (tags) => {
          const result = await context.hooks.modifyHTMLTags.call(tags);
          return result[0];
        }),
        plugins.wasm(),
        plugins.moment(),
        plugins.nodeAddons(),
        plugins.define(),
        import('./plugins/progress').then((m) => m.pluginProgress()),
        import('./plugins/css').then((m) => m.pluginCss()),
        import('./plugins/sass').then((m) => m.pluginSass()),
        import('./plugins/less').then((m) => m.pluginLess()),
        plugins.bundleAnalyzer(),
        plugins.rsdoctor(),
        plugins.splitChunks(),
        plugins.startUrl?.(),
        plugins.inlineChunk(),
        plugins.externals(),
        plugins.performance(),
        plugins.resourceHints(),
        plugins.server(),
        plugins.moduleFederation(),
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
      const { createDevServer } = await import('@rsbuild/core/internal');
      const { createDevMiddleware } = await import('./createCompiler');
      await initRsbuildConfig({ context, pluginManager });
      return createDevServer(
        { context, pluginManager, rsbuildOptions },
        createDevMiddleware,
        options,
      );
    },

    async startDevServer(options) {
      const { createDevServer } = await import('@rsbuild/core/internal');
      const { createDevMiddleware } = await import('./createCompiler');
      await initRsbuildConfig({
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
        options,
      );

      return server.listen();
    },

    async preview(options?: PreviewServerOptions) {
      const { startProdServer } = await import('@rsbuild/core/internal');
      await initRsbuildConfig({
        context,
        pluginManager,
      });
      return startProdServer(context, context.config, options);
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
