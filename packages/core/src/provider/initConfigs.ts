import type {
  EnvironmentConfig,
  InspectConfigOptions,
  PluginManager,
  RspackConfig,
} from '@rsbuild/shared';
import { normalizeConfig } from '../config';
import {
  updateContextByNormalizedConfig,
  updateEnvironmentContext,
} from '../createContext';
import { camelCase } from '../helpers';
import { isDebug, logger } from '../logger';
import { mergeRsbuildConfig } from '../mergeConfig';
import { initPlugins } from '../pluginManager';
import type {
  CreateRsbuildOptions,
  InternalContext,
  NormalizedConfig,
} from '../types';
import { inspectConfig } from './inspectConfig';
import { generateRspackConfig } from './rspackConfig';

async function modifyRsbuildConfig(context: InternalContext) {
  logger.debug('modify Rsbuild config');
  const [modified] = await context.hooks.modifyRsbuildConfig.call(
    context.config,
    { mergeRsbuildConfig },
  );
  context.config = modified;

  logger.debug('modify Rsbuild config done');
}

export type InitConfigsOptions = {
  context: InternalContext;
  pluginManager: PluginManager;
  rsbuildOptions: Required<CreateRsbuildOptions>;
};

const getEnvironmentsConfig = (
  normalizedConfig: NormalizedConfig,
): EnvironmentConfig[] => {
  const { environments, dev, server, ...rsbuildSharedConfig } =
    normalizedConfig;
  if (environments) {
    return Object.entries(environments).map(([name, config]) => ({
      ...mergeRsbuildConfig(
        rsbuildSharedConfig,
        config as unknown as EnvironmentConfig,
      ),
      dev,
      server,
      name,
    }));
  }
  return [
    {
      ...rsbuildSharedConfig,
      dev,
      server,
      // TODO: replace output.targets with output.target
      name: camelCase(rsbuildSharedConfig.output.targets[0]),
    } as EnvironmentConfig,
  ];
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

  const environments = getEnvironmentsConfig(context.normalizedConfig);

  context.environmentConfigs = environments;

  updateEnvironmentContext(context, environments);

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
