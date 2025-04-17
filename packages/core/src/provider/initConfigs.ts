import { getDefaultEntry, normalizeConfig } from '../config';
import { JS_DIST_DIR } from '../constants';
import {
  updateContextByNormalizedConfig,
  updateEnvironmentContext,
} from '../createContext';
import { camelCase, color, pick } from '../helpers';
import { isDebug, logger } from '../logger';
import { mergeRsbuildConfig } from '../mergeConfig';
import { initPlugins } from '../pluginManager';
import type {
  InspectConfigOptions,
  InternalContext,
  MergedEnvironmentConfig,
  ModifyEnvironmentConfigUtils,
  NormalizedConfig,
  NormalizedEnvironmentConfig,
  PluginManager,
  ResolvedCreateRsbuildOptions,
  RsbuildEntry,
  Rspack,
} from '../types';
import { inspectConfig } from './inspectConfig';
import { generateRspackConfig } from './rspackConfig';

async function modifyRsbuildConfig(context: InternalContext) {
  logger.debug('modify Rsbuild config');
  const [modified] = await context.hooks.modifyRsbuildConfig.callChain(
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

  const [modified] = await context.hooks.modifyEnvironmentConfig.callChain({
    environment: name,
    args: [
      config,
      {
        name,
        mergeEnvironmentConfig:
          mergeRsbuildConfig<MergedEnvironmentConfig> as ModifyEnvironmentConfigUtils['mergeEnvironmentConfig'],
      },
    ],
  });

  logger.debug(`modify Rsbuild environment(${name}) config done`);

  return modified;
}

export type InitConfigsOptions = {
  context: InternalContext;
  pluginManager: PluginManager;
  rsbuildOptions: ResolvedCreateRsbuildOptions;
};

const initEnvironmentConfigs = (
  normalizedConfig: NormalizedConfig,
  rootPath: string,
  specifiedEnvironments?: string[],
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

  const isEnvironmentEnabled = (name: string) =>
    !specifiedEnvironments || specifiedEnvironments.includes(name);

  const applyEnvironmentDefaultConfig = (config: MergedEnvironmentConfig) => {
    if (!config.source.entry || Object.keys(config.source.entry).length === 0) {
      config.source.entry = getDefaultEntryWithMemo();
    }

    const isServer = config.output.target === 'node';
    if (config.output.distPath.js === undefined) {
      config.output.distPath.js = isServer ? '' : JS_DIST_DIR;
    }

    return config;
  };

  if (environments && Object.keys(environments).length) {
    const resolvedEnvironments = Object.fromEntries(
      Object.entries(environments)
        .filter(([name]) => isEnvironmentEnabled(name))
        .map(([name, config]) => {
          const environmentConfig: MergedEnvironmentConfig = {
            ...(mergeRsbuildConfig(
              {
                ...rsbuildSharedConfig,
                dev: pick(dev, [
                  'writeToDisk',
                  'hmr',
                  'assetPrefix',
                  'progressBar',
                  'lazyCompilation',
                ]),
              } as MergedEnvironmentConfig,
              config as unknown as MergedEnvironmentConfig,
            ) as MergedEnvironmentConfig),
          };

          return [name, applyEnvironmentDefaultConfig(environmentConfig)];
        }),
    );

    if (!Object.keys(resolvedEnvironments).length) {
      throw new Error(
        `[rsbuild:config] The current build is specified to run only in the ${color.yellow(specifiedEnvironments?.join(','))} environment, but the configuration of the specified environment was not found.`,
      );
    }
    return resolvedEnvironments;
  }

  const defaultEnvironmentName = camelCase(rsbuildSharedConfig.output.target);

  if (!isEnvironmentEnabled(defaultEnvironmentName)) {
    throw new Error(
      `[rsbuild:config] The current build is specified to run only in the ${color.yellow(specifiedEnvironments?.join(','))} environment, but the configuration of the specified environment was not found.`,
    );
  }

  return {
    [defaultEnvironmentName]: applyEnvironmentDefaultConfig({
      ...rsbuildSharedConfig,
      dev: pick(dev, [
        'hmr',
        'assetPrefix',
        'progressBar',
        'lazyCompilation',
        'writeToDisk',
      ]),
    } as MergedEnvironmentConfig),
  };
};

const validateRsbuildConfig = (config: NormalizedConfig) => {
  if (config.server.base && !config.server.base.startsWith('/')) {
    throw new Error(
      `[rsbuild:config] The "server.base" option should start with a slash, for example: "/base"`,
    );
  }
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
    getPluginAPI: context.getPluginAPI!,
    pluginManager,
  });

  await modifyRsbuildConfig(context);

  const normalizedBaseConfig = normalizeConfig(context.config);
  const environments: Record<string, NormalizedEnvironmentConfig> = {};

  const mergedEnvironments = initEnvironmentConfigs(
    normalizedBaseConfig,
    context.rootPath,
    context.specifiedEnvironments,
  );

  const {
    dev: {
      hmr,
      assetPrefix,
      progressBar,
      lazyCompilation,
      writeToDisk,
      ...rsbuildSharedDev
    },
    server,
  } = normalizedBaseConfig;

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
    ...normalizedBaseConfig,
    environments,
  };

  await updateEnvironmentContext(context, environments);
  updateContextByNormalizedConfig(context);
  validateRsbuildConfig(context.normalizedConfig);

  return context.normalizedConfig;
}

export async function initConfigs({
  context,
  pluginManager,
  rsbuildOptions,
}: InitConfigsOptions): Promise<{
  rspackConfigs: Rspack.Configuration[];
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
        bundlerConfigs: rspackConfigs,
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
    rspackConfigs,
  };
}
