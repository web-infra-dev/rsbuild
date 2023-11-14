import {
  color,
  pickRsbuildConfig,
  createPublicContext,
  type RsbuildProvider,
  type RspackConfig,
  type RspackCompiler,
  type RspackMultiCompiler,
  type PreviewServerOptions,
} from '@rsbuild/shared';
import { createContext } from './core/createContext';
import { initConfigs } from './core/initConfigs';
import { getPluginAPI } from './core/initPlugins';
import { applyDefaultPlugins } from './shared/plugin';
import {
  isSatisfyRspackMinimumVersion,
  supportedRspackMinimumVersion,
} from './shared/rspackVersion';
import { startProdServer, startDevServer } from '../server';
import type { RsbuildConfig, NormalizedConfig } from './types';

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
        const { startDevCompile } = await import('./core/createCompiler');
        return startDevServer(
          { context, pluginStore, rsbuildOptions },
          startDevCompile,
          options,
        );
      },

      async preview(options?: PreviewServerOptions) {
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
