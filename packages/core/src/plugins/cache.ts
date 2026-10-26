import { isAbsolute, join } from 'node:path';
import { hash } from '../helpers';
import { findExists, isFileExists } from '../helpers/fs';
import type {
  BuildCacheDiagnostics,
  BuildCacheOptions,
  EnvironmentContext,
  OnAfterEnvironmentCompileFn,
  RsbuildContext,
  RsbuildPlugin,
  Rspack,
} from '../types';

function getCacheDirectory(
  { cacheDirectory }: BuildCacheOptions,
  context: RsbuildContext,
) {
  if (cacheDirectory) {
    return isAbsolute(cacheDirectory)
      ? cacheDirectory
      : join(context.rootPath, cacheDirectory);
  }
  return join(context.cachePath, 'rspack');
}

/**
 * Rspack can't detect the changes of framework config, tsconfig, tailwind config and browserslist config.
 * but they will affect the compilation result, so they need to be added to buildDependencies.
 */
async function getBuildDependencies(
  context: Readonly<RsbuildContext>,
  environmentContext: EnvironmentContext,
  additionalDependencies?: string[],
) {
  const rootPackageJson = join(context.rootPath, 'package.json');
  const browserslistConfig = join(context.rootPath, '.browserslistrc');

  const buildDependencies: Record<string, string[]> = {};

  if (await isFileExists(rootPackageJson)) {
    buildDependencies.packageJson = [rootPackageJson];
  }
  const { tsconfigPath } = environmentContext;

  if (tsconfigPath) {
    buildDependencies.tsconfig = [tsconfigPath];
  }

  if (context.configFile) {
    buildDependencies.rsbuildConfig = [
      context.configFile,
      ...context.configFileDependencies,
    ];
  }

  if (await isFileExists(browserslistConfig)) {
    buildDependencies.browserslistrc = [browserslistConfig];
  }

  const tailwindExts = ['ts', 'js', 'cjs', 'mjs'];
  const configs = tailwindExts.map((ext) =>
    join(context.rootPath, `tailwind.config.${ext}`),
  );
  const tailwindConfig = findExists(configs);

  if (tailwindConfig) {
    buildDependencies.tailwindcss = [tailwindConfig];
  }

  if (additionalDependencies) {
    buildDependencies.additional = additionalDependencies;
  }

  return buildDependencies;
}

export function enableCacheDiagnostics(config: Rspack.Configuration): void {
  const { cache, stats } = config;
  if (typeof cache !== 'object' || cache.type !== 'persistent') return;
  const options: Rspack.StatsOptions =
    typeof stats === 'boolean'
      ? { preset: stats ? 'normal' : 'none' }
      : typeof stats === 'string'
        ? { preset: stats }
        : (stats ?? {});
  config.stats = Object.assign({}, options, { cacheInfo: true });
}

const reportBuildCacheDiagnostics: OnAfterEnvironmentCompileFn = (event) => {
  const callback = event.environment.config.performance.buildCacheDiagnostics;
  if (!callback) return;

  const { environment, stats, ...timing } = event;
  const cache = stats?.compilation.options.cache;
  const configuration = cache && cache.type === 'persistent' ? cache : null;
  const report: BuildCacheDiagnostics = {
    environment: environment.name,
    ...timing,
    mode: configuration
      ? 'persistent'
      : cache === false
        ? 'disabled'
        : cache?.type === 'memory'
          ? 'memory'
          : 'unknown',
    configuration,
    persistent: configuration ? { status: 'unknown', reason: null } : null,
    persistentSessionInitialization: null,
    moduleBuilds: null,
    counters: null,
    statsError: null,
  };
  if (configuration && stats) {
    try {
      // Older Rspack releases omit cacheInfo.
      const options = { all: false, cacheInfo: true };
      const info: Partial<BuildCacheDiagnostics> | undefined =
        stats.toJson(options).cacheInfo;
      report.persistent = info?.persistent ?? report.persistent;
      report.persistentSessionInitialization =
        info?.persistentSessionInitialization ?? null;
      report.moduleBuilds = info?.moduleBuilds ?? null;
      report.counters = info?.counters ?? null;
    } catch (error) {
      report.statsError =
        error instanceof Error ? error.message : String(error);
    }
  }
  return callback(report);
};

export const pluginCache = (): RsbuildPlugin => ({
  name: 'rsbuild:cache',

  setup(api) {
    let cacheEnabled = false;

    api.modifyBundlerChain(async (chain, { environment, env }) => {
      const { config } = environment;
      const { buildCache = false } = config.performance;

      if (buildCache === false) {
        return;
      }

      cacheEnabled = true;

      const { context } = api;
      const cacheConfig = typeof buildCache === 'boolean' ? {} : buildCache;
      const cacheDirectory = getCacheDirectory(cacheConfig, context);
      const buildDependencies = await getBuildDependencies(
        context,
        environment,
        cacheConfig.buildDependencies,
      );

      const useDigest =
        Array.isArray(cacheConfig.cacheDigest) &&
        cacheConfig.cacheDigest.length;

      // set cache name to avoid cache conflicts between different environments
      const cacheVersion = useDigest
        ? `${environment.name}-${env}-${await hash(JSON.stringify(cacheConfig.cacheDigest))}`
        : `${environment.name}-${env}`;

      chain.cache({
        type: 'persistent',
        version: cacheVersion,
        storage: {
          type: 'filesystem',
          directory: cacheDirectory,
        },
        buildDependencies: Object.values(buildDependencies).flat(),
      });
    });

    api.onAfterCreateCompiler(() => {
      if (cacheEnabled) {
        api.logger.debug('Rspack persistent cache enabled');
      }
    });

    api.onAfterEnvironmentCompile(reportBuildCacheDiagnostics);
  },
});
