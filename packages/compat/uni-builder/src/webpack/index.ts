import { RsbuildInstance, createRsbuild } from '@rsbuild/core';
import type {
  RsbuildConfig,
  RsbuildPlugin,
  WebpackProvider,
} from '@rsbuild/webpack';
import type { UniBuilderWebpackConfig } from '../types';
import type { CreateWebpackBuilderOptions } from '../types';
import { parseCommonConfig } from '../shared/parseCommonConfig';

export async function parseConfig(
  uniBuilderConfig: UniBuilderWebpackConfig,
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  const { rsbuildConfig, rsbuildPlugins } =
    parseCommonConfig<'webpack'>(uniBuilderConfig);

  if (uniBuilderConfig.output?.enableAssetManifest) {
    const { pluginManifest } = await import('./plugins/manifest');
    rsbuildPlugins.push(pluginManifest());
  }

  return {
    rsbuildConfig,
    rsbuildPlugins,
  };
}

export async function createWebpackBuilder(
  options: CreateWebpackBuilderOptions,
): Promise<RsbuildInstance<WebpackProvider>> {
  const { rsbuildConfig, rsbuildPlugins } = await parseConfig(options.config);
  const { webpackProvider } = await import('@rsbuild/webpack');
  const rsbuild = await createRsbuild({
    rsbuildConfig,
    provider: webpackProvider,
  });

  rsbuild.addPlugins(rsbuildPlugins);

  return rsbuild;
}
