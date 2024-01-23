import { join, isAbsolute } from 'node:path';
import { initConfigs, type InitConfigsOptions } from './initConfigs';
import {
  setNodeEnv,
  getNodeEnv,
  stringifyConfig,
  outputInspectConfigFiles,
  type NormalizedConfig,
  type InspectConfigResult,
  type InspectConfigOptions,
} from '@rsbuild/shared';
import type { WebpackConfig } from '../types';

export async function inspectConfig({
  context,
  pluginStore,
  rsbuildOptions,
  bundlerConfigs,
  inspectOptions = {},
}: InitConfigsOptions & {
  inspectOptions?: InspectConfigOptions;
  bundlerConfigs?: WebpackConfig[];
}): Promise<InspectConfigResult<'webpack'>> {
  if (inspectOptions.env) {
    setNodeEnv(inspectOptions.env);
  } else if (!getNodeEnv()) {
    setNodeEnv('development');
  }

  const webpackConfigs =
    bundlerConfigs ||
    (
      await initConfigs({
        context,
        pluginStore,
        rsbuildOptions,
      })
    ).webpackConfigs;

  const rsbuildDebugConfig: NormalizedConfig & {
    pluginNames: string[];
  } = {
    ...context.normalizedConfig!,
    pluginNames: pluginStore.plugins.map((p) => p.name),
  };

  const rawRsbuildConfig = await stringifyConfig(
    rsbuildDebugConfig,
    inspectOptions.verbose,
  );
  const rawBundlerConfigs = await Promise.all(
    webpackConfigs.map((config) =>
      stringifyConfig(config, inspectOptions.verbose),
    ),
  );

  let outputPath = inspectOptions.outputPath || context.distPath;
  if (!isAbsolute(outputPath)) {
    outputPath = join(context.rootPath, outputPath);
  }

  if (inspectOptions.writeToDisk) {
    await outputInspectConfigFiles({
      rsbuildConfig: context.normalizedConfig!,
      rawRsbuildConfig,
      bundlerConfigs: rawBundlerConfigs,
      inspectOptions: {
        ...inspectOptions,
        outputPath,
      },
      configType: 'webpack',
    });
  }

  return {
    rsbuildConfig: rawRsbuildConfig,
    bundlerConfigs: rawBundlerConfigs,
    origin: {
      rsbuildConfig: rsbuildDebugConfig,
      bundlerConfigs: webpackConfigs,
    },
  };
}
