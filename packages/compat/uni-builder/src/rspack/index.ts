import { createRsbuild } from '@rsbuild/core';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { RsbuildConfig } from '@rsbuild/core/rspack-provider';
import type { UniBuilderRspackConfig } from '../types';
import type { CreateRspackBuilderOptions } from '../types';

export function parseConfig(uniBuilderConfig: UniBuilderRspackConfig): {
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
} {
  return {
    rsbuildConfig: uniBuilderConfig,
    rsbuildPlugins: [],
  };
}

export async function createRspackBuilder(options: CreateRspackBuilderOptions) {
  const { rsbuildConfig, rsbuildPlugins } = parseConfig(options.config);
  const rsbuild = await createRsbuild({
    rsbuildConfig,
  });

  rsbuild.addPlugins(rsbuildPlugins);

  return rsbuild;
}
