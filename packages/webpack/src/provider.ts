import {
  startProdServer,
  pickBuilderConfig,
  type BuilderProvider,
} from '@rsbuild/shared';
import {
  createContext,
  createPublicContext,
  getPluginAPI,
} from './core/extends';
import { applyDefaultPlugins } from './shared/plugin';
import { BuilderConfig, NormalizedConfig, WebpackConfig } from './types';
import { initConfigs } from './core/initConfigs';
import type { Compiler, MultiCompiler } from 'webpack';

export type BuilderWebpackProvider = BuilderProvider<
  BuilderConfig,
  WebpackConfig,
  NormalizedConfig,
  Compiler | MultiCompiler
>;

export function builderWebpackProvider({
  builderConfig: originalBuilderConfig,
}: {
  builderConfig: BuilderConfig;
}): BuilderWebpackProvider {
  const builderConfig = pickBuilderConfig(originalBuilderConfig);

  return async ({ pluginStore, builderOptions, plugins }) => {
    const context = await createContext(builderOptions, builderConfig);
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
          builderOptions,
        });
        return webpackConfigs;
      },

      async createCompiler() {
        const { createCompiler } = await import('./core/createCompiler');
        const { webpackConfigs } = await initConfigs({
          context,
          pluginStore,
          builderOptions,
        });
        return createCompiler({ context, webpackConfigs });
      },

      async startDevServer(options) {
        const { startDevServer } = await import('./core/startDevServer');
        return startDevServer(
          { context, pluginStore, builderOptions },
          options,
        );
      },

      async serve() {
        return startProdServer(context, context.config);
      },

      async build(options) {
        const { build: buildImpl, webpackBuild } = await import('./core/build');
        return buildImpl(
          { context, pluginStore, builderOptions },
          options,
          webpackBuild,
        );
      },

      async inspectConfig(inspectOptions) {
        const { inspectConfig } = await import('./core/extends');
        return inspectConfig({
          context,
          pluginStore,
          builderOptions,
          inspectOptions,
        });
      },
    };
  };
}
