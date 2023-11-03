import { RsbuildInstance, createRsbuild } from '@rsbuild/core';
import type {
  RsbuildConfig,
  RsbuildPlugin,
  WebpackProvider,
} from '@rsbuild/webpack';
import type { UniBuilderWebpackConfig } from '../types';
import type { CreateWebpackBuilderOptions } from '../types';
import { parseCommonConfig } from '../shared';

export function parseConfig(uniBuilderConfig: UniBuilderWebpackConfig): {
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
} {
  return parseCommonConfig<'webpack'>(uniBuilderConfig);
}

export async function createWebpackBuilder(
  options: CreateWebpackBuilderOptions,
): Promise<RsbuildInstance<WebpackProvider>> {
  const { rsbuildConfig, rsbuildPlugins } = parseConfig(options.config);
  const { webpackProvider } = await import('@rsbuild/webpack');
  const rsbuild = await createRsbuild({
    rsbuildConfig,
    provider: webpackProvider,
  });

  rsbuild.addPlugins(rsbuildPlugins);

  return rsbuild;
}
