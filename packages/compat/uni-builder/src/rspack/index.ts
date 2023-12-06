import { createRsbuild } from '@rsbuild/core';
import type {
  RsbuildConfig,
  RsbuildPlugin,
  RsbuildInstance,
} from '@rsbuild/core';
import type { RsbuildProvider, RsbuildTarget } from '@rsbuild/shared';
import type { UniBuilderRspackConfig } from '../types';
import type { CreateRspackBuilderOptions } from '../types';
import { parseCommonConfig } from '../shared/parseCommonConfig';
import { pluginStyledComponents } from '@rsbuild/plugin-styled-components';
import { withDefaultConfig } from './defaults';

export async function parseConfig(
  uniBuilderConfig: UniBuilderRspackConfig,
  cwd: string,
  frameworkConfigPath?: string,
  target?: RsbuildTarget | RsbuildTarget[],
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
    rsbuildPlugins.push(
      pluginBabel({
        babelLoaderOptions: uniBuilderConfig.tools?.babel,
      }),
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

export async function createRspackBuilder(
  options: CreateRspackBuilderOptions,
): Promise<RsbuildInstance<RsbuildProvider>> {
  const { cwd = process.cwd(), target = 'web' } = options;

  const { rsbuildConfig, rsbuildPlugins } = await parseConfig(
    withDefaultConfig(options.config),
    cwd,
    options.frameworkConfigPath,
    target,
  );
  const rsbuild = await createRsbuild({
    cwd,
    rsbuildConfig,
    target,
  });

  rsbuild.addPlugins(rsbuildPlugins);

  return rsbuild;
}
