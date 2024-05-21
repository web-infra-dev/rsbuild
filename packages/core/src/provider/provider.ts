import {
  type CreateCompiler,
  type PreviewServerOptions,
  type RsbuildProvider,
  pickRsbuildConfig,
} from '@rsbuild/shared';
import { createContext, createPublicContext } from '../createContext';
import { getPluginAPI } from '../initPlugins';
import { plugins } from '../plugins';
import { initConfigs, initRsbuildConfig } from './initConfigs';

export const rspackProvider: RsbuildProvider = async ({
  pluginManager,
  rsbuildOptions,
}) => {
  const rsbuildConfig = pickRsbuildConfig(rsbuildOptions.rsbuildConfig);

  const context = await createContext(rsbuildOptions, rsbuildConfig, 'rspack');
  const pluginAPI = getPluginAPI({ context, pluginManager });

  context.pluginAPI = pluginAPI;

  const createCompiler = (async () => {
    const { createCompiler } = await import('./createCompiler');
    const { rspackConfigs } = await initConfigs({
      context,
      pluginManager,
      rsbuildOptions,
    });

    return createCompiler({
      context,
      rspackConfigs,
    });
  }) as CreateCompiler;

  return {
    bundler: 'rspack',

    pluginAPI,

    createCompiler,

    publicContext: createPublicContext(context),

    async applyDefaultPlugins() {
      const allPlugins = await Promise.all([
        plugins.basic(),
        plugins.entry(),
        // plugins.cache(),
        plugins.target(),
        plugins.output(),
        plugins.resolve(),
        plugins.fileSize(),
        // cleanOutput plugin should before the html plugin
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
        plugins.less(),
        plugins.sass(),
        import('../plugins/minimize').then((m) => m.pluginMinimize()),
        import('../plugins/progress').then((m) => m.pluginProgress()),
        import('../plugins/swc').then((m) => m.pluginSwc()),
        plugins.externals(),
        plugins.splitChunks(),
        plugins.startUrl(),
        plugins.inlineChunk(),
        plugins.bundleAnalyzer(),
        plugins.rsdoctor(),
        plugins.resourceHints(),
        plugins.performance(),
        plugins.server(),
        plugins.moduleFederation(),
        plugins.manifest(),
        import('../plugins/rspackProfile').then((m) => m.pluginRspackProfile()),
      ]);

      pluginManager.addPlugins(allPlugins);
    },

    async createDevServer(options) {
      const { createDevServer } = await import('../server/devServer');
      const { createDevMiddleware } = await import('./createCompiler');
      const config = await initRsbuildConfig({ context, pluginManager });
      return createDevServer(
        { context, pluginManager, rsbuildOptions },
        createDevMiddleware,
        options,
        config,
      );
    },

    async startDevServer(options) {
      const { createDevServer } = await import('../server/devServer');
      const { createDevMiddleware } = await import('./createCompiler');
      const config = await initRsbuildConfig({ context, pluginManager });

      const server = await createDevServer(
        { context, pluginManager, rsbuildOptions },
        createDevMiddleware,
        options,
        config,
      );

      return server.listen();
    },

    async preview(options?: PreviewServerOptions) {
      const { startProdServer } = await import('../server/prodServer');
      const config = await initRsbuildConfig({ context, pluginManager });
      return startProdServer(context, config, options);
    },

    async build(options) {
      const { build } = await import('./build');
      return build({ context, pluginManager, rsbuildOptions }, options);
    },

    async initConfigs() {
      const { rspackConfigs } = await initConfigs({
        context,
        pluginManager,
        rsbuildOptions,
      });
      return rspackConfigs;
    },

    async inspectConfig(inspectOptions) {
      const { inspectConfig } = await import('./inspectConfig');
      return inspectConfig({
        context,
        pluginManager,
        rsbuildOptions,
        inspectOptions,
      });
    },
  };
};
