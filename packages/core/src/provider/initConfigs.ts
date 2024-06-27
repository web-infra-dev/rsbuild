import type {
  InspectConfigOptions,
  MergedEnvironmentConfig,
  ModifyEnvironmentConfigUtils,
  NormalizedEnvironmentConfig,
  PluginManager,
  RsbuildEntry,
  RspackConfig,
} from '@rsbuild/shared';
import { getDefaultEntry, normalizeConfig } from '../config';
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

async function modifyEnvironmentConfig(
  context: InternalContext,
  config: MergedEnvironmentConfig,
  name: string,
) {
  logger.debug(`modify Rsbuild environment(${name}) config`);
  const [modified] = await context.hooks.modifyEnvironmentConfig.call(config, {
    name,
    mergeEnvironmentConfig:
      mergeRsbuildConfig<MergedEnvironmentConfig> as ModifyEnvironmentConfigUtils['mergeEnvironmentConfig'],
  });

  logger.debug(`modify Rsbuild environment(${name}) config done`);

  return modified;
}

export type InitConfigsOptions = {
  context: InternalContext;
  pluginManager: PluginManager;
  rsbuildOptions: Required<CreateRsbuildOptions>;
};

const initEnvironmentConfigs = (
  normalizedConfig: NormalizedConfig,
  rootPath: string,
): Record<string, MergedEnvironmentConfig> => {
  let defaultEntry: RsbuildEntry;
  const getDefaultEntryWithMemo = () => {
    if (!defaultEntry) {
      defaultEntry = getDefaultEntry(rootPath);
    }
    return defaultEntry;
  };
  const { environments, dev, server, provider, ...rsbuildSharedConfig } =
    normalizedConfig;
  const { assetPrefix, lazyCompilation } = dev;

  if (environments && Object.keys(environments).length) {
    return Object.fromEntries(
      Object.entries(environments).map(([name, config]) => {
        const environmentConfig: MergedEnvironmentConfig = {
          ...(mergeRsbuildConfig(
            {
              ...rsbuildSharedConfig,
              dev: {
                assetPrefix,
                lazyCompilation,
              },
            } as unknown as MergedEnvironmentConfig,
            config as unknown as MergedEnvironmentConfig,
          ) as unknown as MergedEnvironmentConfig),
        };

        if (!environmentConfig.source.entry) {
          environmentConfig.source.entry = getDefaultEntryWithMemo();
        }

        return [name, environmentConfig];
      }),
    );
  }

  return {
    [camelCase(rsbuildSharedConfig.output.target)]: {
      ...rsbuildSharedConfig,
      source: {
        ...rsbuildSharedConfig.source,
        entry: rsbuildSharedConfig.source.entry ?? getDefaultEntryWithMemo(),
      },
      dev: {
        assetPrefix,
        lazyCompilation,
      },
    } as MergedEnvironmentConfig,
  };
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
  const normalizeBaseConfig = normalizeConfig(context.config);

  const environments: Record<string, NormalizedEnvironmentConfig> = {};

  const mergedEnvironments = initEnvironmentConfigs(
    normalizeBaseConfig,
    context.rootPath,
  );

  const {
    dev: { assetPrefix, lazyCompilation, ...rsbuildSharedDev },
    server,
  } = normalizeBaseConfig;

  for (const [name, config] of Object.entries(mergedEnvironments)) {
    const environmentConfig = await modifyEnvironmentConfig(
      context,
      config,
      name,
    );

    environments[name] = {
      ...environmentConfig,
      dev: {
        ...environmentConfig.dev,
        ...rsbuildSharedDev,
      },
      server,
    };
  }

  context.normalizedConfig = {
    ...normalizeBaseConfig,
    environments,
  };

  await updateEnvironmentContext(context, environments);
  updateContextByNormalizedConfig(context);

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

  const rspackConfigs = await Promise.all(
    Object.entries(normalizedConfig.environments).map(([environment, config]) =>
      generateRspackConfig({
        target: config.output.target,
        context,
        environment,
      }),
    ),
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
