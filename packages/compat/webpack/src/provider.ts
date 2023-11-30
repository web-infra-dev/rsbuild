import {
  pickRsbuildConfig,
  type RsbuildConfig,
  type RsbuildProvider,
  type PreviewServerOptions,
} from '@rsbuild/shared';
import {
  createPublicContext,
  initRsbuildConfig,
} from '@rsbuild/core/rspack-provider';
import { createContext } from './core/createContext';
import { applyDefaultPlugins } from './shared/plugin';
import { initConfigs } from './core/initConfigs';
import { getPluginAPI } from './core/initPlugins';

export function webpackProvider({
  rsbuildConfig: originalRsbuildConfig,
}: {
  rsbuildConfig: RsbuildConfig;
}): RsbuildProvider {
  const rsbuildConfig = pickRsbuildConfig(originalRsbuildConfig);

  // @ts-expect-error compiler type mismatch
  return async ({ pluginStore, rsbuildOptions, plugins }) => {
    const context = await createContext(rsbuildOptions, rsbuildConfig);
    const pluginAPI = getPluginAPI({ context, pluginStore });

    context.pluginAPI = pluginAPI;

    return {
      bundler: 'webpack',

      pluginAPI,

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

      async createCompiler() {
        const { createCompiler } = await import('./core/createCompiler');
        const { webpackConfigs } = await initConfigs({
          context,
          pluginStore,
          rsbuildOptions,
        });
        return createCompiler({ context, webpackConfigs });
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
          // @ts-expect-error compile type mismatch
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
        const { build: buildImpl, webpackBuild } = await import('./core/build');
        return buildImpl(
          { context, pluginStore, rsbuildOptions },
          options,
          webpackBuild,
        );
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
}
