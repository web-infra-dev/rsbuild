import {
  type InspectConfigOptions,
  type PluginManager,
  type ResolvedCreateRsbuildOptions,
  logger,
} from '@rsbuild/core';
import { inspectConfig } from './inspectConfig.js';
import { type InternalContext, initRsbuildConfig } from './shared.js';
import type { WebpackConfig } from './types.js';
import { generateWebpackConfig } from './webpackConfig.js';

export type InitConfigsOptions = {
  context: InternalContext;
  pluginManager: PluginManager;
  rsbuildOptions: ResolvedCreateRsbuildOptions;
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
    context.hooks.onBeforeBuild.tap(({ isFirstCompile }) => {
      if (isFirstCompile) {
        inspect();
      }
    });
    context.hooks.onAfterStartDevServer.tap(inspect);
  }

  return {
    webpackConfigs,
  };
}
