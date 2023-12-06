import {
  createRsbuild,
  type RsbuildConfig,
  type RsbuildPlugin,
  type RsbuildInstance,
} from '@rsbuild/core';
import type { RsbuildTarget } from '@rsbuild/shared';
import type { UniBuilderWebpackConfig } from '../types';
import type { CreateWebpackBuilderOptions } from '../types';
import { parseCommonConfig } from '../shared/parseCommonConfig';
import { pluginModuleScopes } from './plugins/moduleScopes';
import { pluginStyledComponents } from './plugins/styledComponents';
import { pluginBabel } from './plugins/babel';
import { pluginReact } from './plugins/react';
import { withDefaultConfig } from './defaults';

export async function parseConfig(
  uniBuilderConfig: UniBuilderWebpackConfig,
  cwd: string,
  frameworkConfigPath?: string,
  target?: RsbuildTarget | RsbuildTarget[],
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  const { rsbuildConfig, rsbuildPlugins } = await parseCommonConfig<'webpack'>(
    uniBuilderConfig,
    cwd,
    frameworkConfigPath,
    target,
  );

  rsbuildPlugins.push(
    pluginBabel({
      babelLoaderOptions: uniBuilderConfig.tools?.babel,
    }),
  );
  rsbuildPlugins.push(pluginReact());

  if (uniBuilderConfig.tools?.tsLoader) {
    const { pluginTsLoader } = await import('./plugins/tsLoader');
    rsbuildPlugins.push(
      pluginTsLoader(
        uniBuilderConfig.tools.tsLoader,
        uniBuilderConfig.tools.babel,
      ),
    );
  }

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

  rsbuildPlugins.push(
    pluginStyledComponents(uniBuilderConfig.tools?.styledComponents),
  );

  return {
    rsbuildConfig,
    rsbuildPlugins,
  };
}

export async function createWebpackBuilder(
  options: CreateWebpackBuilderOptions,
): Promise<RsbuildInstance> {
  const { rsbuildConfig, rsbuildPlugins } = await parseConfig(
    withDefaultConfig(options.config),
    options.cwd,
    options.frameworkConfigPath,
    options.target,
  );

  const { webpackProvider } = await import('@rsbuild/webpack');
  const rsbuild = await createRsbuild({
    rsbuildConfig,
    provider: webpackProvider,
    target: options.target || 'web',
  });

  rsbuild.addPlugins([
    ...rsbuildPlugins,
    pluginModuleScopes(options.config.source?.moduleScopes),
  ]);

  return rsbuild;
}
