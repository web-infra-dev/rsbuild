import {
  color,
  pickRsbuildConfig,
  type RsbuildProvider,
  type RspackConfig,
  type RspackCompiler,
  type RspackMultiCompiler,
  type PreviewServerOptions,
} from '@rsbuild/shared';
import { createContext, createPublicContext } from './core/createContext';
import { initConfigs } from './core/initConfigs';
import { getPluginAPI } from './core/initPlugins';
import {
  applyDefaultPlugins,
  isSatisfyRspackMinimumVersion,
  supportedRspackMinimumVersion,
} from './shared';
import type { RsbuildConfig, NormalizedConfig } from '../types';

export type RspackProvider = RsbuildProvider<
  RsbuildConfig,
  RspackConfig,
  NormalizedConfig,
  RspackCompiler | RspackMultiCompiler
>;

export function rspackProvider({
  rsbuildConfig: originalRsbuildConfig,
}: {
  rsbuildConfig: RsbuildConfig;
}): RspackProvider {
  const rsbuildConfig = pickRsbuildConfig(originalRsbuildConfig);

  return async ({ pluginStore, rsbuildOptions, plugins }) => {
    if (!(await isSatisfyRspackMinimumVersion())) {
      throw new Error(
        `The current Rspack version does not meet the requirements, the minimum supported version of Rspack is ${color.green(
          supportedRspackMinimumVersion,
        )}`,
      );
    }

    const context = await createContext(rsbuildOptions, rsbuildConfig);
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

        // todo: compiler type declaration
        return createCompiler({
          context,
          rspackConfigs,
        }) as any;
      },

      async startDevServer(options) {
        const { startDevServer } = await import('../server/devServer');
        const { createDevMiddleware } = await import('./core/createCompiler');
        return startDevServer(
          { context, pluginStore, rsbuildOptions },
          createDevMiddleware,
          options,
        );
      },

      async preview(options?: PreviewServerOptions) {
        const { startProdServer } = await import('../server/prodServer');
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
