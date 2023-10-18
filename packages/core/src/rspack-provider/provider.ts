import {
  startProdServer,
  pickBuilderConfig,
  createPublicContext,
  type BuilderProvider,
} from '@rsbuild/shared';
import { chalk } from '@rsbuild/shared/chalk';
import { createContext } from '../base/createContext';
import { initConfigs } from './core/initConfigs';
import { getPluginAPI } from './core/initPlugins';
import { applyDefaultPlugins } from './shared/plugin';
import {
  isSatisfyRspackMinimumVersion,
  supportedRspackMinimumVersion,
} from './shared/rspackVersion';
import type {
  Compiler,
  RspackConfig,
  BuilderConfig,
  NormalizedConfig,
  MultiCompiler,
  Context,
} from './types';
import { initHooks } from './core/initHooks';
import { validateBuilderConfig } from './config/validate';

import { withDefaultConfig } from './config/defaults';

export type BuilderRspackProvider = BuilderProvider<
  BuilderConfig,
  RspackConfig,
  NormalizedConfig,
  Compiler | MultiCompiler
>;

export function builderRspackProvider({
  builderConfig: originalBuilderConfig,
}: {
  builderConfig: BuilderConfig;
}): BuilderRspackProvider {
  const builderConfig = pickBuilderConfig(originalBuilderConfig);
  const bundlerType = 'rspack';

  return async ({ pluginStore, builderOptions, plugins }) => {
    if (!(await isSatisfyRspackMinimumVersion())) {
      throw new Error(
        `The current Rspack version does not meet the requirements, the minimum supported version of Rspack is ${chalk.green(
          supportedRspackMinimumVersion,
        )}`,
      );
    }

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

      async createCompiler() {
        const { createCompiler } = await import('./core/createCompiler');
        const { rspackConfigs } = await initConfigs({
          context,
          pluginStore,
          builderOptions,
        });

        // todo: compiler 类型定义
        return createCompiler({
          context,
          rspackConfigs,
        }) as any;
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
        const { build: buildImpl, rspackBuild } = await import('./core/build');
        return buildImpl(
          { context, pluginStore, builderOptions },
          options,
          rspackBuild,
        );
      },

      async initConfigs() {
        const { rspackConfigs } = await initConfigs({
          context,
          pluginStore,
          builderOptions,
        });
        return rspackConfigs;
      },

      async inspectConfig(inspectOptions) {
        const { inspectConfig } = await import('../base/inspectConfig');
        return inspectConfig({
          initConfigs: async () =>
            (
              await initConfigs({
                context,
                pluginStore,
                builderOptions,
              })
            ).rspackConfigs,
          context,
          builderOptions,
          inspectOptions,
          bundlerType,
        });
      },
    };
  };
}
