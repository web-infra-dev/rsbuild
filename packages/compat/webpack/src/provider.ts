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
} from '@rsbuild/core/provider';
import { applyDefaultPlugins } from './shared';
import { initConfigs } from './core/initConfigs';

export const webpackProvider: RsbuildProvider<'webpack'> = async ({
  plugins,
  pluginStore,
  rsbuildOptions,
}) => {
  const rsbuildConfig = pickRsbuildConfig(rsbuildOptions.rsbuildConfig);
  const context = await createContext(rsbuildOptions, rsbuildConfig, 'webpack');
  const pluginAPI = getPluginAPI({ context, pluginStore });

  context.pluginAPI = pluginAPI;

  const createCompiler = (async () => {
    const { createCompiler } = await import('./core/createCompiler');
    const { webpackConfigs } = await initConfigs({
      context,
      pluginStore,
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
      pluginStore.addPlugins(await applyDefaultPlugins(plugins));
    },

    async initConfigs() {
      const { webpackConfigs } = await initConfigs({
        context,
        pluginStore,
        rsbuildOptions,
      });
      return webpackConfigs;
    },

    async getServerAPIs(options) {
      const { getServerAPIs } = await import('@rsbuild/core/server');
      const { createDevMiddleware } = await import('./core/createCompiler');
      await initRsbuildConfig({ context, pluginStore });
      return getServerAPIs(
        { context, pluginStore, rsbuildOptions },
        createDevMiddleware,
        options,
      );
    },

    async startDevServer(options) {
      const { startDevServer } = await import('@rsbuild/core/server');
      const { createDevMiddleware } = await import('./core/createCompiler');
      await initRsbuildConfig({
        context,
        pluginStore,
      });
      return startDevServer(
        {
          context,
          pluginStore,
          rsbuildOptions,
        },
        createDevMiddleware,
        options,
      );
    },

    async preview(options?: PreviewServerOptions) {
      const { startProdServer } = await import('@rsbuild/core/server');
      await initRsbuildConfig({
        context,
        pluginStore,
      });
      return startProdServer(context, context.config, options);
    },

    async build(options) {
      const { build } = await import('./core/build');
      return build({ context, pluginStore, rsbuildOptions }, options);
    },

    async inspectConfig(inspectOptions) {
      const { inspectConfig } = await import('./core/inspectConfig');
      return await inspectConfig({
        context,
        pluginStore,
        rsbuildOptions,
        inspectOptions,
      });
    },
  };
};
