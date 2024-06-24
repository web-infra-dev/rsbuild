import {
  type CreateRsbuildOptions,
  type InspectConfigOptions,
  logger,
} from '@rsbuild/core';
import type { PluginManager } from '@rsbuild/shared';
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

  const webpackConfigs = await Promise.all(
    Object.entries(normalizedConfig.environments).map(([environment, config]) =>
      generateWebpackConfig({
        target: config.output.target,
        context,
        environment,
      }),
    ),
  );

  // write Rsbuild config and webpack config to disk in debug mode
  if (logger.level === 'verbose') {
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
