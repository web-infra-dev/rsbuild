import { type PluginStore } from '@rsbuild/shared';
import type { Context, BuilderPluginAPI, BuilderConfig } from '../types';
import { getPluginAPI as getBasePluginAPI } from '@rsbuild/core/base/initPlugins';
import { inspectConfig as inspectBaseConfig } from '@rsbuild/core/base/inspectConfig';
import { createContext as createBaseContext } from '@rsbuild/core/base/createContext';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import { InspectConfigOptions } from '@rsbuild/shared';
import type { WebpackConfig } from '../types';
import { type CreateBuilderOptions } from '@rsbuild/shared';
import { initHooks } from './initHooks';
import { validateBuilderConfig } from '../config/validate';
import { withDefaultConfig } from '../config/defaults';

/**
 * Generate the actual context used in the build,
 * which can have a lot of overhead and take some side effects.
 */
export async function createContext(
  options: Required<CreateBuilderOptions>,
  builderConfig: BuilderConfig,
): Promise<Context> {
  return createBaseContext<Context>({
    builderOptions: options,
    userBuilderConfig: builderConfig,
    initBuilderConfig: () => withDefaultConfig(builderConfig),
    validateBuilderConfig,
    initHooks,
    bundlerType: 'webpack',
  });
}

export async function inspectConfig({
  context,
  pluginStore,
  builderOptions,
  bundlerConfigs,
  inspectOptions = {},
}: InitConfigsOptions & {
  inspectOptions?: InspectConfigOptions;
  bundlerConfigs?: WebpackConfig[];
}) {
  return inspectBaseConfig({
    initConfigs: async () =>
      (
        await initConfigs({
          context,
          pluginStore,
          builderOptions,
        })
      ).webpackConfigs,
    bundlerConfigs,
    context,
    builderOptions,
    inspectOptions,
    bundlerType: 'webpack',
  });
}

export function getPluginAPI({
  context,
  pluginStore,
}: {
  context: Context;
  pluginStore: PluginStore;
}): BuilderPluginAPI {
  const { hooks } = context;

  return getBasePluginAPI({
    context,
    pluginStore,
    pluginHooks: {
      onExit: hooks.onExitHook.tap,
      onAfterBuild: hooks.onAfterBuildHook.tap,
      onBeforeBuild: hooks.onBeforeBuildHook.tap,
      onDevCompileDone: hooks.onDevCompileDoneHook.tap,
      modifyBundlerChain: hooks.modifyBundlerChainHook.tap,
      modifyWebpackChain: hooks.modifyWebpackChainHook.tap,
      modifyWebpackConfig: hooks.modifyWebpackConfigHook.tap,
      modifyBuilderConfig: hooks.modifyBuilderConfigHook.tap,
      onAfterCreateCompiler: hooks.onAfterCreateCompilerHook.tap,
      onBeforeCreateCompiler: hooks.onBeforeCreateCompilerHook.tap,
      onAfterStartDevServer: hooks.onAfterStartDevServerHook.tap,
      onBeforeStartDevServer: hooks.onBeforeStartDevServerHook.tap,
    },
  });
}
