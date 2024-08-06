import { isAbsolute, join } from 'node:path';
import type { InspectConfigOptions, InspectConfigResult } from '@rsbuild/core';
import { type InitConfigsOptions, initConfigs } from './initConfigs';
import {
  type InternalContext,
  getRsbuildInspectConfig,
  outputInspectConfigFiles,
  stringifyConfig,
} from './shared';
import type { WebpackConfig } from './types';

const getInspectOutputPath = (
  context: InternalContext,
  inspectOptions: InspectConfigOptions,
) => {
  if (inspectOptions.outputPath) {
    if (isAbsolute(inspectOptions.outputPath)) {
      return inspectOptions.outputPath;
    }

    return join(context.distPath, inspectOptions.outputPath);
  }

  return context.distPath;
};

export async function inspectConfig({
  context,
  pluginManager,
  rsbuildOptions,
  bundlerConfigs,
  inspectOptions = {},
}: InitConfigsOptions & {
  inspectOptions?: InspectConfigOptions;
  bundlerConfigs?: WebpackConfig[];
}): Promise<InspectConfigResult<'webpack'>> {
  if (inspectOptions.mode) {
    process.env.NODE_ENV = inspectOptions.mode;
  } else if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  const webpackConfigs =
    bundlerConfigs ||
    (
      await initConfigs({
        context,
        pluginManager,
        rsbuildOptions,
      })
    ).webpackConfigs;

  const rawBundlerConfigs = webpackConfigs.map((config, index) => ({
    name: config.name || String(index),
    content: stringifyConfig(config, inspectOptions.verbose),
  }));

  const {
    rsbuildConfig,
    rawRsbuildConfig,
    environmentConfigs,
    rawEnvironmentConfigs,
  } = getRsbuildInspectConfig({
    normalizedConfig: context.normalizedConfig!,
    inspectOptions,
    pluginManager,
  });

  const outputPath = getInspectOutputPath(context, inspectOptions);

  if (inspectOptions.writeToDisk) {
    await outputInspectConfigFiles({
      rawBundlerConfigs,
      rawEnvironmentConfigs,
      inspectOptions: {
        ...inspectOptions,
        outputPath,
      },
      configType: 'webpack',
    });
  }

  return {
    rsbuildConfig: rawRsbuildConfig,
    environmentConfigs: rawEnvironmentConfigs.map((r) => r.content),
    bundlerConfigs: rawBundlerConfigs.map((r) => r.content),
    origin: {
      rsbuildConfig,
      environmentConfigs,
      bundlerConfigs: webpackConfigs,
    },
  };
}
