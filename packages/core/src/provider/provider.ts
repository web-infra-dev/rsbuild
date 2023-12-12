import {
  pickRsbuildConfig,
  type RsbuildProvider,
  type PreviewServerOptions,
} from '@rsbuild/shared';
import { createContext, createPublicContext } from './core/createContext';
import { initConfigs, initRsbuildConfig } from './core/initConfigs';
import { getPluginAPI } from './core/initPlugins';
import { applyDefaultPlugins } from './shared';
import type { RsbuildConfig } from '../types';

export function rspackProvider({
  rsbuildConfig: originalRsbuildConfig,
}: {
  rsbuildConfig: RsbuildConfig;
}): RsbuildProvider {
  const rsbuildConfig = pickRsbuildConfig(originalRsbuildConfig);

  return async ({ pluginStore, rsbuildOptions, plugins }) => {
    const context = await createContext(
      rsbuildOptions,
      rsbuildConfig,
      'rspack',
    );
    const pluginAPI = getPluginAPI({ context, pluginStore });

    context.pluginAPI = pluginAPI;

    return {
      bundler: 'rspack',

      pluginAPI,

      publicContext: createPublicContext(context),

      async applyDefaultPlugins() {
        pluginStore.addPlugins(await applyDefaultPlugins(plugins));
      },

      async createCompiler() {
        const { createCompiler } = await import('./core/createCompiler');
        const { rspackConfigs } = await initConfigs({
          context,
          pluginStore,
          rsbuildOptions,
        });

        return createCompiler({
          context,
          rspackConfigs,
        });
      },

      async getServerAPIs(options) {
        const { getServerAPIs } = await import('../server/devServer');
        const { createDevMiddleware } = await import('./core/createCompiler');
        await initRsbuildConfig({ context, pluginStore });
        return getServerAPIs(
          { context, pluginStore, rsbuildOptions },
          createDevMiddleware,
          options,
        );
      },

      async startDevServer(options) {
        const { startDevServer } = await import('../server/devServer');
        const { createDevMiddleware } = await import('./core/createCompiler');
        await initRsbuildConfig({ context, pluginStore });
        return startDevServer(
          { context, pluginStore, rsbuildOptions },
          createDevMiddleware,
          options,
        );
      },

      async preview(options?: PreviewServerOptions) {
        const { startProdServer } = await import('../server/prodServer');
        await initRsbuildConfig({ context, pluginStore });
        return startProdServer(context, context.config, options);
      },

      async build(options) {
        const { build: buildImpl, rspackBuild } = await import('./core/build');
        return buildImpl(
          { context, pluginStore, rsbuildOptions },
          options,
          rspackBuild,
        );
      },

      async initConfigs() {
        const { rspackConfigs } = await initConfigs({
          context,
          pluginStore,
          rsbuildOptions,
        });
        return rspackConfigs;
      },

      async inspectConfig(inspectOptions) {
        const { inspectConfig } = await import('./core/inspectConfig');
        return inspectConfig({
          context,
          pluginStore,
          rsbuildOptions,
          inspectOptions,
        });
      },
    };
  };
}
