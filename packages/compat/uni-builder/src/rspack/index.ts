import { createRsbuild } from '@rsbuild/core';
import type { RsbuildInstance, RsbuildPlugin } from '@rsbuild/core';
import type {
  RsbuildConfig,
  RspackProvider,
} from '@rsbuild/core/rspack-provider';
import type { UniBuilderRspackConfig } from '../types';
import type { CreateRspackBuilderOptions } from '../types';
import { parseCommonConfig } from '../shared/parseCommonConfig';

export async function parseConfig(
  uniBuilderConfig: UniBuilderRspackConfig,
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  const { rsbuildConfig, rsbuildPlugins } =
    parseCommonConfig<'rspack'>(uniBuilderConfig);

  if (uniBuilderConfig.output?.enableAssetManifest) {
    const { pluginManifest } = await import('./plugins/manifest');
    rsbuildPlugins.push(pluginManifest());
  }

  return {
    rsbuildConfig,
    rsbuildPlugins,
  };
}

export async function createRspackBuilder(
  options: CreateRspackBuilderOptions,
): Promise<RsbuildInstance<RspackProvider>> {
  const { rsbuildConfig, rsbuildPlugins } = await parseConfig(options.config);
  const rsbuild = await createRsbuild({
    rsbuildConfig,
  });

  rsbuild.addPlugins(rsbuildPlugins);

  return rsbuild;
}
