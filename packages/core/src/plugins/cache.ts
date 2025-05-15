import crypto from 'node:crypto';
import fs from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { color, findExists, isFileExists } from '../helpers';
import { logger } from '../logger';
import type {
  BuildCacheOptions,
  EnvironmentContext,
  NormalizedEnvironmentConfig,
  RsbuildContext,
  RsbuildPlugin,
} from '../types';

/**
 * If the filenames in the buildDependencies are changed, webpack will not invalidate the previous cache.
 * So we need to remove the cache directory to make sure the cache is invalidated.
 */
async function validateWebpackCache(
  cacheDirectory: string,
  buildDependencies: Record<string, string[]>,
) {
  const configFile = join(cacheDirectory, 'buildDependencies.json');

  if (await isFileExists(configFile)) {
    const rawConfigFile = await fs.promises.readFile(configFile, 'utf-8');

    let prevBuildDependencies: Record<string, string[]> | null = null;
    try {
      prevBuildDependencies = JSON.parse(rawConfigFile);
    } catch (e) {
      logger.debug('failed to parse the previous buildDependencies.json', e);
    }

    if (
      JSON.stringify(prevBuildDependencies) ===
      JSON.stringify(buildDependencies)
    ) {
      return;
    }

    await fs.promises.rm(cacheDirectory, { force: true, recursive: true });
  }

  await fs.promises.mkdir(cacheDirectory, { recursive: true });
  await fs.promises.writeFile(configFile, JSON.stringify(buildDependencies));
}

function hash(digest: Array<string | undefined>) {
  const hasher = crypto.createHash('sha256');
  return hasher.update(JSON.stringify(digest)).digest('hex').slice(0, 16);
}

function getCacheDirectory(
  { cacheDirectory }: BuildCacheOptions,
  context: RsbuildContext,
) {
  if (cacheDirectory) {
    return isAbsolute(cacheDirectory)
      ? cacheDirectory
      : join(context.rootPath, cacheDirectory);
  }
  return join(context.cachePath, context.bundlerType);
}

/**
 * Rspack can't detect the changes of framework config, tsconfig, tailwind config and browserslist config.
 * but they will affect the compilation result, so they need to be added to buildDependencies.
 */
async function getBuildDependencies(
  context: Readonly<RsbuildContext>,
  config: NormalizedEnvironmentConfig,
  environmentContext: EnvironmentContext,
  userBuildDependencies: Record<string, string[]>,
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

  if (config._privateMeta?.configFilePath) {
    buildDependencies.rsbuildConfig = [config._privateMeta.configFilePath];
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

  return {
    ...buildDependencies,
    ...userBuildDependencies,
  };
}

export const pluginCache = (): RsbuildPlugin => ({
  name: 'rsbuild:cache',

  setup(api) {
    let cacheEnabled = false;

    api.modifyBundlerChain(async (chain, { environment, env }) => {
      const { config } = environment;
      const { bundlerType } = api.context;

      // Enable webpack persistent cache by default
      // Rspack's persistent cache is still experimental and should be manually enabled
      const buildCache =
        config.performance.buildCache ?? bundlerType === 'webpack';

      if (buildCache === false) {
        return;
      }

      cacheEnabled = true;

      const { context } = api;
      const cacheConfig = typeof buildCache === 'boolean' ? {} : buildCache;
      const cacheDirectory = getCacheDirectory(cacheConfig, context);
      const buildDependencies = await getBuildDependencies(
        context,
        config,
        environment,
        cacheConfig.buildDependencies
          ? {
              userBuildDependencies: cacheConfig.buildDependencies,
            }
          : {},
      );

      if (bundlerType === 'webpack') {
        await validateWebpackCache(cacheDirectory, buildDependencies);
      }

      const useDigest =
        Array.isArray(cacheConfig.cacheDigest) &&
        cacheConfig.cacheDigest.length;

      // set cache name to avoid cache conflicts between different environments
      const cacheVersion = useDigest
        ? `${environment.name}-${env}-${hash(cacheConfig.cacheDigest!)}`
        : `${environment.name}-${env}`;

      if (bundlerType === 'rspack') {
        chain.cache(true);
        chain.experiments({
          ...chain.get('experiments'),
          cache: {
            type: 'persistent',
            version: cacheVersion,
            storage: {
              type: 'filesystem',
              directory: cacheDirectory,
            },
            buildDependencies: Object.values(buildDependencies).flat(),
          },
        });
      } else {
        chain.cache({
          name: cacheVersion,
          type: 'filesystem',
          cacheDirectory,
          buildDependencies,
        });
      }
    });

    api.onAfterCreateCompiler(() => {
      // Tell user that the cache is enabled and it's experimental
      if (cacheEnabled && api.context.bundlerType === 'rspack') {
        logger.info(
          `Rspack persistent cache enabled ${color.dim('(experimental)')}`,
        );
      }
    });
  },
});
