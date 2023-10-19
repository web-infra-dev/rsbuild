import type {
  PluginStore,
  CreateBuilderOptions,
  InspectConfigOptions,
} from '@rsbuild/shared';
import type {
  Context,
  BuilderConfig,
  BuilderPluginAPI,
  RspackConfig,
} from '../types';
import { getPluginAPI as getBasePluginAPI } from '../../base/initPlugins';
import { inspectConfig as inspectBaseConfig } from '../../base/inspectConfig';
import { createContext as createBaseContext } from '../../base/createContext';
import { bundlerType } from '../shared';
import { initHooks } from './initHooks';
import { validateBuilderConfig } from '../config/validate';
import { withDefaultConfig } from '../config/defaults';
import { initConfigs, InitConfigsOptions } from './initConfigs';

export async function inspectConfig({
  context,
  pluginStore,
  builderOptions,
  bundlerConfigs,
  inspectOptions = {},
}: InitConfigsOptions & {
  inspectOptions?: InspectConfigOptions;
  bundlerConfigs?: RspackConfig[];
}) {
  return inspectBaseConfig({
    initConfigs: async () =>
      (
        await initConfigs({
          context,
          pluginStore,
          builderOptions,
        })
      ).rspackConfigs,
    context,
    bundlerConfigs,
    builderOptions,
    inspectOptions,
    bundlerType,
  });
}

export async function createContext(
  options: Required<CreateBuilderOptions>,
  userBuilderConfig: BuilderConfig,
) {
  return createBaseContext<Context>({
    builderOptions: options,
    userBuilderConfig: userBuilderConfig,
    initBuilderConfig: () => withDefaultConfig(userBuilderConfig),
    validateBuilderConfig,
    initHooks,
    bundlerType,
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
      modifyRspackConfig: hooks.modifyRspackConfigHook.tap,
      modifyBuilderConfig: hooks.modifyBuilderConfigHook.tap,
      modifyBundlerChain: hooks.modifyBundlerChainHook.tap,
      onAfterCreateCompiler: hooks.onAfterCreateCompilerHook.tap,
      onBeforeCreateCompiler: hooks.onBeforeCreateCompilerHook.tap,
      onAfterStartDevServer: hooks.onAfterStartDevServerHook.tap,
      onBeforeStartDevServer: hooks.onBeforeStartDevServerHook.tap,
    },
  });
}
