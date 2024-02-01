import {
  pickRsbuildConfig,
  type CreateCompiler,
  type RsbuildProvider,
  type PreviewServerOptions,
} from '@rsbuild/shared';
import { createContext, createPublicContext } from './core/createContext';
import { initConfigs, initRsbuildConfig } from './core/initConfigs';
import { getPluginAPI } from './core/initPlugins';
import { applyDefaultPlugins } from './shared';

export const rspackProvider: RsbuildProvider = async ({
  pluginManager,
  rsbuildOptions,
  plugins,
}) => {
  const rsbuildConfig = pickRsbuildConfig(rsbuildOptions.rsbuildConfig);

  const context = await createContext(rsbuildOptions, rsbuildConfig, 'rspack');
  const pluginAPI = getPluginAPI({ context, pluginManager });

  context.pluginAPI = pluginAPI;

  const createCompiler = (async () => {
    const { createCompiler } = await import('./core/createCompiler');
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
      pluginManager.addPlugins(await applyDefaultPlugins(plugins));
    },

    async getServerAPIs(options) {
      const { getServerAPIs } = await import('../server/devServer');
      const { createDevMiddleware } = await import('./core/createCompiler');
      await initRsbuildConfig({ context, pluginManager });
      return getServerAPIs(
        { context, pluginManager, rsbuildOptions },
        createDevMiddleware,
        options,
      );
    },

    async startDevServer(options) {
      const { startDevServer } = await import('../server/devServer');
      const { createDevMiddleware } = await import('./core/createCompiler');
      await initRsbuildConfig({ context, pluginManager });
      return startDevServer(
        { context, pluginManager, rsbuildOptions },
        createDevMiddleware,
        options,
      );
    },

    async preview(options?: PreviewServerOptions) {
      const { startProdServer } = await import('../server/prodServer');
      await initRsbuildConfig({ context, pluginManager });
      return startProdServer(context, context.config, options);
    },

    async build(options) {
      const { build } = await import('./core/build');
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
      const { inspectConfig } = await import('./core/inspectConfig');
      return inspectConfig({
        context,
        pluginManager,
        rsbuildOptions,
        inspectOptions,
      });
    },
  };
};
