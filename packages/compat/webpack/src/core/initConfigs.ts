import {
  debug,
  isDebug,
  castArray,
  initPlugins,
  mergeRsbuildConfig,
  updateContextByNormalizedConfig,
  type PluginStore,
  type InspectConfigOptions,
  type CreateRsbuildOptions,
} from '@rsbuild/shared';
import { inspectConfig } from './inspectConfig';
import { generateWebpackConfig } from './webpackConfig';
import { normalizeConfig } from '../config/normalize';
import type { Context, WebpackConfig } from '../types';

async function modifyRsbuildConfig(context: Context) {
  debug('modify Rsbuild config');
  const [modified] = await context.hooks.modifyRsbuildConfigHook.call(
    context.config,
    { mergeRsbuildConfig },
  );
  context.config = modified;
  debug('modify Rsbuild config done');
}

export type InitConfigsOptions = {
  context: Context;
  pluginStore: PluginStore;
  rsbuildOptions: Required<CreateRsbuildOptions>;
};

export async function initConfigs({
  context,
  pluginStore,
  rsbuildOptions,
}: InitConfigsOptions): Promise<{
  webpackConfigs: WebpackConfig[];
}> {
  await initPlugins({
    pluginAPI: context.pluginAPI,
    pluginStore,
  });

  await modifyRsbuildConfig(context);

  const normalizedConfig = normalizeConfig(context.config);
  context.normalizedConfig = normalizedConfig;
  updateContextByNormalizedConfig(context, context.normalizedConfig);

  const targets = castArray(rsbuildOptions.target);
  const webpackConfigs = await Promise.all(
    targets.map((target) => generateWebpackConfig({ target, context })),
  );

  // write Rsbuild config and webpack config to disk in debug mode
  if (isDebug()) {
    const inspect = () => {
      const inspectOptions: InspectConfigOptions = {
        verbose: true,
        writeToDisk: true,
      };
      inspectConfig({
        context,
        pluginStore,
        inspectOptions,
        rsbuildOptions,
        bundlerConfigs: webpackConfigs,
      });
    };

    // run inspect later to avoid cleaned by cleanOutput plugin
    context.hooks.onBeforeBuildHook.tap(inspect);
    context.hooks.onBeforeStartDevServerHook.tap(inspect);
  }

  return {
    webpackConfigs,
  };
}
