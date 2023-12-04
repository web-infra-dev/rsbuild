import { createRsbuild } from '@rsbuild/core';
import type {
  RsbuildConfig,
  RsbuildPlugin,
  RsbuildInstance,
} from '@rsbuild/core';
import type { RsbuildProvider } from '@rsbuild/shared';
import type { UniBuilderRspackConfig, BuilderTarget } from '../types';
import type { CreateRspackBuilderOptions } from '../types';
import {
  parseCommonConfig,
  getRsbuildTarget,
} from '../shared/parseCommonConfig';
import { pluginStyledComponents } from '@rsbuild/plugin-styled-components';

export async function parseConfig(
  uniBuilderConfig: UniBuilderRspackConfig,
  cwd: string,
  frameworkConfigPath?: string,
  target?: BuilderTarget | BuilderTarget[],
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  const { rsbuildConfig, rsbuildPlugins } = await parseCommonConfig<'rspack'>(
    uniBuilderConfig,
    cwd,
    frameworkConfigPath,
    target,
  );

  if (uniBuilderConfig.output?.enableAssetManifest) {
    const { pluginManifest } = await import('./plugins/manifest');
    rsbuildPlugins.push(pluginManifest());
  }

  if (uniBuilderConfig.tools?.babel) {
    const { pluginBabel } = await import('@rsbuild/plugin-babel');
    rsbuildPlugins.push(pluginBabel(uniBuilderConfig.tools?.babel));
  }

  rsbuildPlugins.push(
    pluginStyledComponents(uniBuilderConfig.tools?.styledComponents),
  );

  return {
    rsbuildConfig,
    rsbuildPlugins,
  };
}

export async function createRspackBuilder(
  options: CreateRspackBuilderOptions,
): Promise<RsbuildInstance<RsbuildProvider>> {
  const { rsbuildConfig, rsbuildPlugins } = await parseConfig(
    options.config,
    options.cwd,
    options.frameworkConfigPath,
    options.target,
  );
  const rsbuild = await createRsbuild({
    rsbuildConfig,
    target: getRsbuildTarget(options.target),
  });

  rsbuild.addPlugins(rsbuildPlugins);

  return rsbuild;
}
