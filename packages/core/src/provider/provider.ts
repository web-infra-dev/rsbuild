import {
  pickRsbuildConfig,
  type CreateCompiler,
  type RsbuildProvider,
  type PreviewServerOptions,
} from '@rsbuild/shared';
import { createContext, createPublicContext } from './createContext';
import { initConfigs, initRsbuildConfig } from './initConfigs';
import { getPluginAPI } from './initPlugins';
import { applyDefaultPlugins } from './shared';

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
      pluginManager.addPlugins(await applyDefaultPlugins());
    },

    async createDevServer(options) {
      const { createDevServer } = await import('../server/devServer');
      const { createDevMiddleware } = await import('./createCompiler');
      await initRsbuildConfig({ context, pluginManager });
      return createDevServer(
        { context, pluginManager, rsbuildOptions },
        createDevMiddleware,
        options,
      );
    },

    async startDevServer(options) {
      const { createDevServer } = await import('../server/devServer');
      const { createDevMiddleware } = await import('./createCompiler');
      await initRsbuildConfig({ context, pluginManager });

      const server = await createDevServer(
        { context, pluginManager, rsbuildOptions },
        createDevMiddleware,
        options,
      );

      return server.listen();
    },

    async preview(options?: PreviewServerOptions) {
      const { startProdServer } = await import('../server/prodServer');
      await initRsbuildConfig({ context, pluginManager });
      return startProdServer(context, context.config, options);
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
