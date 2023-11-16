import { RsbuildInstance, createRsbuild } from '@rsbuild/core';
import type {
  RsbuildConfig,
  RsbuildPlugin,
  WebpackProvider,
} from '@rsbuild/webpack';
import type { UniBuilderWebpackConfig } from '../types';
import type { CreateWebpackBuilderOptions } from '../types';
import { parseCommonConfig } from '../shared/parseCommonConfig';
import { pluginModuleScopes } from './plugins/moduleScopes';

export async function parseConfig(
  uniBuilderConfig: UniBuilderWebpackConfig,
  frameworkConfigPath?: string,
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  const { rsbuildConfig, rsbuildPlugins } = parseCommonConfig<'webpack'>(
    uniBuilderConfig,
    frameworkConfigPath,
  );

  if (uniBuilderConfig.output?.enableAssetManifest) {
    const { pluginManifest } = await import('./plugins/manifest');
    rsbuildPlugins.push(pluginManifest());
  }

  if (uniBuilderConfig.security?.sri) {
    const { pluginSRI } = await import('./plugins/sri');
    rsbuildPlugins.push(pluginSRI(uniBuilderConfig.security?.sri));
  }

  if (uniBuilderConfig.experiments?.lazyCompilation) {
    const { pluginLazyCompilation } = await import('./plugins/lazyCompilation');
    rsbuildPlugins.push(
      pluginLazyCompilation(uniBuilderConfig.experiments?.lazyCompilation),
    );
  }

  return {
    rsbuildConfig,
    rsbuildPlugins,
  };
}

export async function createWebpackBuilder(
  options: CreateWebpackBuilderOptions,
): Promise<RsbuildInstance<WebpackProvider>> {
  const { rsbuildConfig, rsbuildPlugins } = await parseConfig(
    options.config,
    options.frameworkConfigPath,
  );
  const { webpackProvider } = await import('@rsbuild/webpack');
  const rsbuild = await createRsbuild({
    rsbuildConfig,
    provider: webpackProvider,
  });

  rsbuild.addPlugins([
    ...rsbuildPlugins,
    pluginModuleScopes(options.config.source?.moduleScopes),
  ]);

  return rsbuild;
}
