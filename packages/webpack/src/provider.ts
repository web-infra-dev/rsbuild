import {
  startProdServer,
  pickBuilderConfig,
  createPublicContext,
  type BuilderProvider,
} from '@rsbuild/shared';
import { createContext } from '@rsbuild/core/base/createContext';
import { applyDefaultPlugins } from './shared/plugin';
import {
  Context,
  BuilderConfig,
  NormalizedConfig,
  WebpackConfig,
} from './types';
import { initConfigs } from './core/initConfigs';
import { getPluginAPI } from './core/initPlugins';
import type { Compiler, MultiCompiler } from 'webpack';
import { initHooks } from './core/initHooks';
import { validateBuilderConfig } from './config/validate';
import { withDefaultConfig } from './config/defaults';

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
  const bundlerType = 'webpack';

  return async ({ pluginStore, builderOptions, plugins }) => {
    const context = await createContext<Context>({
      builderOptions,
      userBuilderConfig: builderConfig,
      initBuilderConfig: () => withDefaultConfig(builderConfig),
      validateBuilderConfig,
      initHooks,
      bundlerType,
    });

    const pluginAPI = getPluginAPI({ context, pluginStore });

    context.pluginAPI = pluginAPI;

    return {
      bundler: bundlerType,

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
        const { inspectConfig } = await import(
          '@rsbuild/core/base/inspectConfig'
        );
        return inspectConfig({
          initConfigs: async () =>
            (
              await initConfigs({
                context,
                pluginStore,
                builderOptions,
              })
            ).webpackConfigs,
          context,
          builderOptions,
          inspectOptions,
          bundlerType,
        });
      },
    };
  };
}
