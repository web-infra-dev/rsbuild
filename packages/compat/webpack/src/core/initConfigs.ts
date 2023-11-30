import {
  isDebug,
  castArray,
  type PluginStore,
  type InspectConfigOptions,
  type CreateRsbuildOptions,
} from '@rsbuild/shared';
import { initRsbuildConfig } from '@rsbuild/core/rspack-provider';
import { inspectConfig } from './inspectConfig';
import { generateWebpackConfig } from './webpackConfig';
import type { Context, WebpackConfig } from '../types';

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
  await initRsbuildConfig({
    context,
    pluginStore,
  });

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
