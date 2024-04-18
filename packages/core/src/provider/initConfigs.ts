import {
  debug,
  isDebug,
  type PluginManager,
  type RspackConfig,
  type InspectConfigOptions,
  type CreateRsbuildOptions,
} from '@rsbuild/shared';
import { mergeRsbuildConfig } from '../mergeConfig';
import { updateContextByNormalizedConfig } from '../createContext';
import { inspectConfig } from './inspectConfig';
import { generateRspackConfig } from './rspackConfig';
import { normalizeConfig } from '../config';
import { initPlugins } from '../pluginManager';
import type { InternalContext, NormalizedConfig } from '../types';

async function modifyRsbuildConfig(context: InternalContext) {
  debug('modify Rsbuild config');
  const [modified] = await context.hooks.modifyRsbuildConfig.call(
    context.config,
    { mergeRsbuildConfig },
  );
  context.config = modified;

  debug('modify Rsbuild config done');
}

export type InitConfigsOptions = {
  context: InternalContext;
  pluginManager: PluginManager;
  rsbuildOptions: Required<CreateRsbuildOptions>;
};

export async function initRsbuildConfig({
  context,
  pluginManager,
}: Pick<
  InitConfigsOptions,
  'context' | 'pluginManager'
>): Promise<NormalizedConfig> {
  // initialized
  if (context.normalizedConfig) {
    return context.normalizedConfig;
  }

  await initPlugins({
    pluginAPI: context.pluginAPI,
    pluginManager,
  });

  await modifyRsbuildConfig(context);
  context.normalizedConfig = normalizeConfig(context.config);
  updateContextByNormalizedConfig(context, context.normalizedConfig);

  return context.normalizedConfig;
}

export async function initConfigs({
  context,
  pluginManager,
  rsbuildOptions,
}: InitConfigsOptions): Promise<{
  rspackConfigs: RspackConfig[];
}> {
  const normalizedConfig = await initRsbuildConfig({ context, pluginManager });
  const { targets } = normalizedConfig.output;

  const rspackConfigs = await Promise.all(
    targets.map((target) => generateRspackConfig({ target, context })),
  );

  // write Rsbuild config and Rspack config to disk in debug mode
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
        bundlerConfigs: rspackConfigs,
      });
    };

    // run inspect later to avoid cleaned by cleanOutput plugin
    context.hooks.onBeforeBuild.tap(inspect);
    context.hooks.onAfterStartDevServer.tap(inspect);
  }

  return {
    rspackConfigs,
  };
}
