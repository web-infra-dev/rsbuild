import { JS_DIST_DIR } from '../constants';
import {
  updateContextByNormalizedConfig,
  updateEnvironmentContext,
} from '../createContext';
import { getDefaultEntry, normalizeConfig } from '../defaultConfig';
import { camelCase, color, ensureAbsolutePath, pick } from '../helpers';
import { inspectConfig } from '../inspectConfig';
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
import { generateRspackConfig } from './rspackConfig';

async function modifyRsbuildConfig(context: InternalContext) {
  logger.debug('modify Rsbuild config');

  const pluginsCount = context.config.plugins?.length ?? 0;
  const [modified] = await context.hooks.modifyRsbuildConfig.callChain(
    context.config,
    { mergeRsbuildConfig },
  );
  context.config = modified;

  const newPluginsCount = modified.plugins?.length ?? 0;
  if (newPluginsCount !== pluginsCount) {
    logger.warn(
      `${color.dim('[rsbuild]')} Cannot change plugins via ${color.yellow(
        'modifyRsbuildConfig',
      )} as plugins are already initialized when it executes.`,
    );
  }

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

  const {
    environments,
    dev,
    server: _server,
    provider: _provider,
    ...rsbuildSharedConfig
  } = normalizedConfig;

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
        `${color.dim('[rsbuild:config]')} The current build is specified to run only in the ${color.yellow(
          specifiedEnvironments?.join(','),
        )} environment, but the configuration of the specified environment was not found.`,
      );
    }
    return resolvedEnvironments;
  }

  const defaultEnvironmentName = camelCase(rsbuildSharedConfig.output.target);

  if (!isEnvironmentEnabled(defaultEnvironmentName)) {
    throw new Error(
      `${color.dim('[rsbuild:config]')} The current build is specified to run only in the ${color.yellow(
        specifiedEnvironments?.join(','),
      )} environment, but the configuration of the specified environment was not found.`,
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
      `${color.dim('[rsbuild:config]')} The ${color.yellow(
        '"server.base"',
      )} option should start with a slash, for example: "/base"`,
    );
  }

  if (config.environments) {
    const names = Object.keys(config.environments);
    const regexp = /^[\w$-]+$/;
    for (const name of names) {
      // ensure environment names are filesystem and property access safe
      if (!regexp.test(name)) {
        logger.warn(
          `${color.dim('[rsbuild:config]')} Environment name "${color.yellow(name)}" contains invalid characters. Only letters, numbers, "-", "_", and "$" are allowed.`,
        );
      }
    }
  }
};

/**
 * Initialize the Rsbuild config
 * 1. Initialize the Rsbuild plugins
 * 2. Run all the `modifyRsbuildConfig` hooks
 * 3. Normalize the Rsbuild config, merge with the default config
 * 4. Initialize the configs for each environment
 * 5. Run all the `modifyEnvironmentConfig` hooks
 * 6. Validate the final Rsbuild config
 */
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
      hmr: _hmr,
      assetPrefix: _assetPrefix,
      progressBar: _progressBar,
      lazyCompilation: _lazyCompilation,
      writeToDisk: _writeToDisk,
      ...rsbuildSharedDev
    },
    server,
  } = normalizedBaseConfig;

  const tsconfigPaths = new Set<string>();

  for (const [name, config] of Object.entries(mergedEnvironments)) {
    const environmentConfig = await modifyEnvironmentConfig(
      context,
      config,
      name,
    );

    const normalizedEnvironmentConfig = {
      ...environmentConfig,
      dev: {
        ...environmentConfig.dev,
        ...rsbuildSharedDev,
      },
      server,
    };

    const { tsconfigPath } = normalizedEnvironmentConfig.source;

    // Ensure the `tsconfigPath` is an absolute path
    if (tsconfigPath) {
      const absoluteTsconfigPath = ensureAbsolutePath(
        context.rootPath,
        tsconfigPath,
      );
      normalizedEnvironmentConfig.source.tsconfigPath = absoluteTsconfigPath;
      tsconfigPaths.add(absoluteTsconfigPath);
    }

    environments[name] = normalizedEnvironmentConfig;
  }

  // watch tsconfig files and restart server when tsconfig files changed
  // to ensure `paths` alias can be updated
  if (
    tsconfigPaths.size &&
    normalizedBaseConfig.resolve.aliasStrategy === 'prefer-tsconfig'
  ) {
    normalizedBaseConfig.dev.watchFiles.push({
      paths: Array.from(tsconfigPaths),
      type: 'reload-server',
    });
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
