import crypto from 'node:crypto';
import fs from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { findExists, isFileExists } from '../helpers';
import type {
  BuildCacheOptions,
  EnvironmentContext,
  NormalizedEnvironmentConfig,
  RsbuildContext,
  RsbuildPlugin,
} from '../types';

async function validateCache(
  cacheDirectory: string,
  buildDependencies: Record<string, string[]>,
) {
  const configFile = join(cacheDirectory, 'buildDependencies.json');

  if (await isFileExists(configFile)) {
    const rawConfigFile = await fs.promises.readFile(configFile, 'utf-8');
    const prevBuildDependencies = JSON.parse(rawConfigFile);

    if (
      JSON.stringify(prevBuildDependencies) ===
      JSON.stringify(buildDependencies)
    ) {
      return;
    }

    /**
     * If the filenames in the buildDependencies are changed, webpack will not invalidate the previous cache.
     * So we need to remove the cache directory to make sure the cache is invalidated.
     */
    await fs.promises.rm(cacheDirectory, { force: true, recursive: true });
  }

  await fs.promises.mkdir(cacheDirectory, { recursive: true });
  await fs.promises.writeFile(configFile, JSON.stringify(buildDependencies));
}

function getDigestHash(digest: Array<string | undefined>) {
  const fsHash = crypto.createHash('md5');
  const md5 = fsHash.update(JSON.stringify(digest)).digest('hex').slice(0, 8);
  return md5;
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
 * webpack can't detect the changes of framework config, tsconfig, tailwind config and browserslist config.
 * but they will affect the compilation result, so they need to be added to buildDependencies.
 */
async function getBuildDependencies(
  context: Readonly<RsbuildContext>,
  config: NormalizedEnvironmentConfig,
  environmentContext: EnvironmentContext,
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

  return buildDependencies;
}

export const pluginCache = (): RsbuildPlugin => ({
  name: 'rsbuild:cache',

  setup(api) {
    // Rspack does not support persistent cache yet
    if (api.context.bundlerType === 'rspack') {
      return;
    }

    api.modifyBundlerChain(async (chain, { environment, env }) => {
      const { config } = environment;
      const { buildCache } = config.performance;

      if (buildCache === false) {
        chain.cache(false);
        return;
      }

      const { context } = api;
      const cacheConfig = typeof buildCache === 'boolean' ? {} : buildCache;
      const cacheDirectory = getCacheDirectory(cacheConfig, context);
      const buildDependencies = await getBuildDependencies(
        context,
        config,
        environment,
      );

      await validateCache(cacheDirectory, buildDependencies);

      const useDigest =
        Array.isArray(cacheConfig.cacheDigest) &&
        cacheConfig.cacheDigest.length;

      chain.cache({
        // The default cache name of webpack is '${name}-${env}', and the `name` is `default` by default.
        // We set cache name to avoid cache conflicts of different targets.
        name: useDigest
          ? `${environment.name}-${env}-${getDigestHash(cacheConfig.cacheDigest!)}`
          : `${environment.name}-${env}`,
        type: 'filesystem',
        cacheDirectory,
        buildDependencies,
      });
    });
  },
});
