import {
  type InspectConfigOptions,
  type InternalContext,
  type PluginManager,
  type ResolvedCreateRsbuildOptions,
  type RsbuildProviderHelpers,
  logger,
} from '@rsbuild/core';
import { inspectConfig } from './inspectConfig.js';
import type { WebpackConfig } from './types.js';
import { generateWebpackConfig } from './webpackConfig.js';

export type InitConfigsOptions = {
  context: InternalContext;
  pluginManager: PluginManager;
  rsbuildOptions: ResolvedCreateRsbuildOptions;
  helpers: RsbuildProviderHelpers;
};

export async function initConfigs({
  context,
  pluginManager,
  rsbuildOptions,
  helpers,
}: InitConfigsOptions): Promise<{
  webpackConfigs: WebpackConfig[];
}> {
  const normalizedConfig = await helpers.initRsbuildConfig({
    context,
    pluginManager,
  });

  const webpackConfigs = await Promise.all(
    Object.entries(normalizedConfig.environments).map(([environment, config]) =>
      generateWebpackConfig({
        target: config.output.target,
        context,
        environment,
        helpers,
      }),
    ),
  );

  // write Rsbuild config and webpack config to disk in debug mode
  if (logger.level === 'verbose') {
    const inspect = async () => {
      const inspectOptions: InspectConfigOptions = {
        verbose: true,
        writeToDisk: true,
      };
      await inspectConfig({
        context,
        pluginManager,
        inspectOptions,
        rsbuildOptions,
        bundlerConfigs: webpackConfigs,
        helpers,
      });
    };

    // run inspect later to avoid cleaned by cleanOutput plugin
    context.hooks.onBeforeBuild.tap(async ({ isFirstCompile }) => {
      if (isFirstCompile) {
        await inspect();
      }
    });
    context.hooks.onAfterStartDevServer.tap(inspect);
  }

  return {
    webpackConfigs,
  };
}
