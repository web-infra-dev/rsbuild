import {
  pickRsbuildConfig,
  type CreateCompiler,
  type RsbuildProvider,
  type PreviewServerOptions,
} from '@rsbuild/shared';
import {
  getPluginAPI,
  createContext,
  initRsbuildConfig,
  createPublicContext,
} from '@rsbuild/core/internal';
import { applyDefaultPlugins } from './shared';
import { initConfigs } from './core/initConfigs';

export const webpackProvider: RsbuildProvider<'webpack'> = async ({
  plugins,
  pluginManager,
  rsbuildOptions,
}) => {
  const rsbuildConfig = pickRsbuildConfig(rsbuildOptions.rsbuildConfig);
  const context = await createContext(rsbuildOptions, rsbuildConfig, 'webpack');
  const pluginAPI = getPluginAPI({ context, pluginManager });

  context.pluginAPI = pluginAPI;

  const createCompiler = (async () => {
    const { createCompiler } = await import('./core/createCompiler');
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
      pluginManager.addPlugins(await applyDefaultPlugins(plugins));
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
      const { createDevMiddleware } = await import('./core/createCompiler');
      await initRsbuildConfig({ context, pluginManager });
      return createDevServer(
        { context, pluginManager, rsbuildOptions },
        createDevMiddleware,
        options,
      );
    },

    async startDevServer(options) {
      const { createDevServer } = await import('@rsbuild/core/internal');
      const { createDevMiddleware } = await import('./core/createCompiler');
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
      const { build } = await import('./core/build');
      return build({ context, pluginManager, rsbuildOptions }, options);
    },

    async inspectConfig(inspectOptions) {
      const { inspectConfig } = await import('./core/inspectConfig');
      return await inspectConfig({
        context,
        pluginManager,
        rsbuildOptions,
        inspectOptions,
      });
    },
  };
};
