import type { CreateRsbuildOptions } from '@rsbuild/core';
import {
  type InspectConfigOptions,
  type PluginManager,
  isDebug,
} from '@rsbuild/shared';
import { inspectConfig } from './inspectConfig';
import { type InternalContext, initRsbuildConfig } from './shared';
import type { WebpackConfig } from './types';
import { generateWebpackConfig } from './webpackConfig';

export type InitConfigsOptions = {
  context: InternalContext;
  pluginManager: PluginManager;
  rsbuildOptions: Required<CreateRsbuildOptions>;
};

export async function initConfigs({
  context,
  pluginManager,
  rsbuildOptions,
}: InitConfigsOptions): Promise<{
  webpackConfigs: WebpackConfig[];
}> {
  const normalizedConfig = await initRsbuildConfig({
    context,
    pluginManager,
  });
  const { targets } = normalizedConfig.output;

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
        pluginManager,
        inspectOptions,
        rsbuildOptions,
        bundlerConfigs: webpackConfigs,
      });
    };

    // run inspect later to avoid cleaned by cleanOutput plugin
    context.hooks.onBeforeBuild.tap(inspect);
    context.hooks.onAfterStartDevServer.tap(inspect);
  }

  return {
    webpackConfigs,
  };
}
