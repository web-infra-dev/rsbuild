import { createRsbuild } from '@rsbuild/core';
import type {
  RsbuildConfig,
  RsbuildPlugin,
  RsbuildInstance,
} from '@rsbuild/core';
import type { RspackProvider } from '@rsbuild/core/rspack-provider';
import type { UniBuilderRspackConfig } from '../types';
import type { CreateRspackBuilderOptions } from '../types';
import { parseCommonConfig } from '../shared/parseCommonConfig';
import { pluginStyledComponents } from '@rsbuild/plugin-styled-components';
import { pluginCssMinimizer } from '@rsbuild/plugin-css-minimizer';

export async function parseConfig(
  uniBuilderConfig: UniBuilderRspackConfig,
  cwd: string,
  frameworkConfigPath?: string,
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  const { rsbuildConfig, rsbuildPlugins } = await parseCommonConfig<'rspack'>(
    uniBuilderConfig,
    cwd,
    frameworkConfigPath,
  );

  if (uniBuilderConfig.output?.enableAssetManifest) {
    const { pluginManifest } = await import('./plugins/manifest');
    rsbuildPlugins.push(pluginManifest());
  }

  rsbuildPlugins.push(
    pluginStyledComponents(uniBuilderConfig.tools?.styledComponents),
  );

  rsbuildPlugins.push(
    pluginCssMinimizer({
      pluginOptions: uniBuilderConfig.tools?.minifyCss,
    }),
  );

  return {
    rsbuildConfig,
    rsbuildPlugins,
  };
}

export async function createRspackBuilder(
  options: CreateRspackBuilderOptions,
): Promise<RsbuildInstance<RspackProvider>> {
  const { rsbuildConfig, rsbuildPlugins } = await parseConfig(
    options.config,
    options.cwd,
    options.frameworkConfigPath,
  );
  const rsbuild = await createRsbuild({
    rsbuildConfig,
  });

  rsbuild.addPlugins(rsbuildPlugins);

  return rsbuild;
}
