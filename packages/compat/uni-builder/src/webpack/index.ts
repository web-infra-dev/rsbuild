import { createRsbuild } from '@rsbuild/core';
import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/webpack';
import type { UniBuilderWebpackConfig } from '../types';
import type { CreateWebpackBuilderOptions } from '../types';

export function parseConfig(uniBuilderConfig: UniBuilderWebpackConfig): {
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
} {
  return {
    rsbuildConfig: uniBuilderConfig,
    rsbuildPlugins: [],
  };
}

export async function createWebpackBuilder(
  options: CreateWebpackBuilderOptions,
) {
  const { rsbuildConfig, rsbuildPlugins } = parseConfig(options.config);
  const { webpackProvider } = await import('@rsbuild/webpack');
  const rsbuild = await createRsbuild({
    rsbuildConfig,
    provider: webpackProvider,
  });

  rsbuild.addPlugins(rsbuildPlugins);

  return rsbuild;
}
