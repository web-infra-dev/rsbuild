import { isAbsolute, join } from 'node:path';
import type {
  InspectConfigOptions,
  InspectConfigResult,
  InternalContext,
} from '@rsbuild/core';
import { type InitConfigsOptions, initConfigs } from './initConfigs.js';
import type { WebpackConfig } from './types.js';

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

  return join(context.distPath, '.rsbuild');
};

export async function inspectConfig({
  helpers,
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
        helpers,
      })
    ).webpackConfigs;

  const rawBundlerConfigs = webpackConfigs.map((config, index) => ({
    name: config.name || String(index),
    content: helpers.stringifyConfig(config, inspectOptions.verbose),
  }));

  const {
    rsbuildConfig,
    rawRsbuildConfig,
    environmentConfigs,
    rawEnvironmentConfigs,
  } = helpers.getRsbuildInspectConfig({
    normalizedConfig: context.normalizedConfig!,
    inspectOptions,
    pluginManager,
  });

  const outputPath = getInspectOutputPath(context, inspectOptions);

  if (inspectOptions.writeToDisk) {
    await helpers.outputInspectConfigFiles({
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
