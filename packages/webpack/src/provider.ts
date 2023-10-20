import {
  startProdServer,
  pickRsbuildConfig,
  createPublicContext,
  type RsbuildProvider,
} from '@rsbuild/shared';
import { createContext } from './core/createContext';
import { applyDefaultPlugins } from './shared/plugin';
import { RsbuildConfig, NormalizedConfig, WebpackConfig } from './types';
import { initConfigs } from './core/initConfigs';
import { getPluginAPI } from './core/initPlugins';
import type { Compiler, MultiCompiler } from 'webpack';

export type WebpackProvider = RsbuildProvider<
  RsbuildConfig,
  WebpackConfig,
  NormalizedConfig,
  Compiler | MultiCompiler
>;

export function webpackProvider({
  rsbuildConfig: originalRsbuildConfig,
}: {
  rsbuildConfig: RsbuildConfig;
}): WebpackProvider {
  const rsbuildConfig = pickRsbuildConfig(originalRsbuildConfig);

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
        const { startDevServer } = await import('./core/startDevServer');
        return startDevServer(
          { context, pluginStore, rsbuildOptions },
          options,
        );
      },

      async serve() {
        return startProdServer(context, context.config);
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
