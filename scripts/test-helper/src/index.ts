import path from 'node:path';
import { isPromise } from 'node:util/types';
import type {
  BundlerPluginInstance,
  CreateRsbuildOptions,
  RsbuildInstance,
  RsbuildPlugin,
  RsbuildPlugins,
  Rspack,
  RspackRule,
} from '@rsbuild/core';
import upath from 'upath';

export const isPathString = (test: string): boolean =>
  path.posix.basename(test) !== test || path.win32.basename(test) !== test;

export const isRelativePath = (test: string): boolean =>
  /^\.\.?($|[\\/])/.test(test);

export const normalizeToPosixPath = (p: string | undefined) =>
  upath
    .normalizeSafe(path.normalize(p || ''))
    .replace(/^([a-zA-Z]+):/, (_, m: string) => `/${m.toLowerCase()}`);

/** Match plugin by constructor name. */
export const matchPlugin = (
  config: Rspack.Configuration,
  pluginName: string,
) => {
  const result = config.plugins?.filter(
    (item) => item?.constructor.name === pluginName,
  );

  if (Array.isArray(result)) {
    return result[0] || null;
  }
  return result || null;
};

/**
 * different with rsbuild createRsbuild. support add custom plugins instead of applyDefaultPlugins.
 */
export async function createStubRsbuild({
  rsbuildConfig = {},
  plugins,
  ...options
}: CreateRsbuildOptions & {
  plugins?: RsbuildPlugins;
}): Promise<
  RsbuildInstance & {
    unwrapConfig: () => Promise<Record<string, any>>;
    matchBundlerPlugin: (name: string) => Promise<BundlerPluginInstance | null>;
  }
> {
  const { createRsbuild } = await import('@rsbuild/core');
  const rsbuildOptions = {
    cwd: process.env.REBUILD_TEST_SUITE_CWD || process.cwd(),
    rsbuildConfig,
    ...options,
  };

  // mock default entry
  if (!rsbuildConfig.source?.entry && !rsbuildConfig.environments) {
    rsbuildConfig.source ||= {};
    rsbuildConfig.source.entry = {
      index: './src/index.js',
    };
  }

  const rsbuild = await createRsbuild(rsbuildOptions);

  const getFlattenedPlugins = async (pluginOptions: RsbuildPlugins) => {
    let plugins = pluginOptions;
    do {
      plugins = (await Promise.all(plugins)).flat(
        Number.POSITIVE_INFINITY as 1,
      );
    } while (plugins.some((v) => isPromise(v)));

    return plugins as Array<RsbuildPlugin | false | null | undefined>;
  };

  if (plugins) {
    // remove all builtin plugins
    rsbuild.removePlugins(rsbuild.getPlugins().map((item) => item.name));
    rsbuild.addPlugins(await getFlattenedPlugins(plugins));
  }

  const unwrapConfig = async (index = 0) => {
    const configs = await rsbuild.initConfigs();
    return configs[index];
  };

  /** Match rspack/webpack plugin by constructor name. */
  const matchBundlerPlugin = async (pluginName: string, index?: number) => {
    const config = await unwrapConfig(index);

    return matchPlugin(config, pluginName) as BundlerPluginInstance;
  };

  return {
    ...rsbuild,
    unwrapConfig,
    matchBundlerPlugin,
  };
}

export function matchRules(
  config: Rspack.Configuration,
  testFile: string,
): RspackRule[] {
  if (!config.module?.rules) {
    return [];
  }
  return config.module.rules.filter((rule) => {
    if (
      rule &&
      typeof rule === 'object' &&
      rule.test &&
      rule.test instanceof RegExp &&
      rule.test.test(testFile)
    ) {
      return true;
    }
    return false;
  });
}
