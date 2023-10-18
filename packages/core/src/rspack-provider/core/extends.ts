import { type PluginStore } from '@rsbuild/shared';
import type { Context, BuilderConfig, BuilderPluginAPI } from '../types';
import { getPluginAPI as getBasePluginAPI } from '../../base/initPlugins';
import { inspectConfig as inspectBaseConfig } from '../../base/inspectConfig';
import { type CreateBuilderOptions } from '@rsbuild/shared';
import { initHooks } from './initHooks';
import { validateBuilderConfig } from '../config/validate';
import { withDefaultConfig } from '../config/defaults';
import { createContext as createBaseContext } from '../../base/createContext';

import { initConfigs, InitConfigsOptions } from './initConfigs';
import { InspectConfigOptions } from '@rsbuild/shared';
import type { RspackConfig } from '../types';

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
    bundlerType: 'rspack',
  });
}

/**
 * Generate the actual context used in the build,
 * which can have a lot of overhead and take some side effects.
 */
export async function createContext(
  options: Required<CreateBuilderOptions>,
  userBuilderConfig: BuilderConfig,
): Promise<Context> {
  return createBaseContext<Context>({
    builderOptions: options,
    userBuilderConfig: userBuilderConfig,
    initBuilderConfig: () => withDefaultConfig(userBuilderConfig),
    validateBuilderConfig,
    initHooks,
    bundlerType: 'rspack',
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
