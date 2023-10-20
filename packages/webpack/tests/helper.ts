import { type CreateRsbuildOptions } from '@rsbuild/shared';
import type { RsbuildPlugin, RsbuildConfig } from '@/types';
import assert from 'assert';
import { webpackProvider } from '@/provider';
import { join } from 'path';
import {
  createStubRsbuild as createBaseRsbuild,
  matchLoader,
  matchPlugin,
} from '@rsbuild/vitest-helper';

export const fixturesDir = join(__dirname, 'fixtures');

/**
 * different with rsbuild.createRsbuild. support add custom plugins instead of applyDefaultPlugins.
 */
export async function createStubRsbuild({
  rsbuildConfig = {},
  plugins,
  ...options
}: CreateRsbuildOptions & {
  rsbuildConfig?: RsbuildConfig;
  plugins?: RsbuildPlugin[];
}) {
  const rsbuild = await createBaseRsbuild({
    provider: webpackProvider,
    rsbuildConfig,
    plugins,
    ...options,
  });

  /** Unwrap webpack configs. */
  const unwrapWebpackConfigs = async () => {
    const webpackConfigs = await rsbuild.initConfigs();
    return webpackConfigs;
  };

  /** Unwrap webpack config, it will ensure there's only one config object. */
  const unwrapWebpackConfig = async () => {
    const webpackConfigs = await unwrapWebpackConfigs();
    assert(webpackConfigs.length === 1);
    return webpackConfigs[0];
  };

  /** Match webpack plugin by constructor name. */
  const matchWebpackPlugin = async (pluginName: string) => {
    const config = await unwrapWebpackConfig();

    return matchPlugin(config, pluginName);
  };

  /** Check if a file handled by specific loader. */
  const matchWebpackLoader = async (loader: string, testFile: string) =>
    matchLoader({ config: await unwrapWebpackConfig(), loader, testFile });

  return {
    ...rsbuild,
    unwrapWebpackConfig,
    unwrapWebpackConfigs,
    matchWebpackPlugin,
    matchWebpackLoader,
  };
}
