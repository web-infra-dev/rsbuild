import { isAbsolute, join } from 'node:path';
import {
  getRsbuildInspectConfig,
  outputInspectConfigFiles,
  stringifyConfig,
} from '../config';
import { getNodeEnv, setNodeEnv } from '../helpers';
import type {
  InspectConfigOptions,
  InspectConfigResult,
  InternalContext,
  Rspack,
} from '../types';
import { type InitConfigsOptions, initConfigs } from './initConfigs';

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
  bundlerConfigs?: Rspack.Configuration[];
}): Promise<InspectConfigResult<'rspack'>> {
  if (inspectOptions.mode) {
    setNodeEnv(inspectOptions.mode);
  } else if (!getNodeEnv()) {
    setNodeEnv('development');
  }

  const rspackConfigs =
    bundlerConfigs ||
    (
      await initConfigs({
        context,
        pluginManager,
        rsbuildOptions,
      })
    ).rspackConfigs;

  const rawBundlerConfigs = rspackConfigs.map((config, index) => ({
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
      configType: 'rspack',
    });
  }

  return {
    rsbuildConfig: rawRsbuildConfig,
    environmentConfigs: rawEnvironmentConfigs.map((r) => r.content),
    bundlerConfigs: rawBundlerConfigs.map((r) => r.content),
    origin: {
      rsbuildConfig,
      environmentConfigs,
      bundlerConfigs: rspackConfigs,
    },
  };
}
