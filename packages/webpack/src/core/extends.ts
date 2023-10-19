import type {
  WebpackConfig,
  Context,
  BuilderPluginAPI,
  BuilderConfig,
} from '../types';
import type {
  CreateBuilderOptions,
  InspectConfigOptions,
  PluginStore,
} from '@rsbuild/shared';
import { getPluginAPI as getBasePluginAPI } from '@rsbuild/core/base/initPlugins';
import { inspectConfig as inspectBaseConfig } from '@rsbuild/core/base/inspectConfig';
import {
  createContext as createBaseContext,
  createPublicContext,
} from '@rsbuild/core/base/createContext';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import { initHooks } from './initHooks';
import { validateBuilderConfig } from '../config/validate';
import { withDefaultConfig } from '../config/defaults';

export { createPublicContext };

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
