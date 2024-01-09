import {
  isDebug,
  type PluginStore,
  type InspectConfigOptions,
  type CreateRsbuildOptions,
} from '@rsbuild/shared';
import {
  initRsbuildConfig,
  type InternalContext,
} from '@rsbuild/core/provider';
import { inspectConfig } from './inspectConfig';
import { generateWebpackConfig } from './webpackConfig';
import type { WebpackConfig } from '../types';

export type InitConfigsOptions = {
  context: InternalContext;
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
  const normalizedConfig = await initRsbuildConfig({
    context,
    pluginStore,
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
        pluginStore,
        inspectOptions,
        rsbuildOptions,
        bundlerConfigs: webpackConfigs,
      });
    };

    // run inspect later to avoid cleaned by cleanOutput plugin
    context.hooks.onBeforeBuild.tap(inspect);
    context.hooks.onBeforeStartDevServer.tap(inspect);
  }

  return {
    webpackConfigs,
  };
}
