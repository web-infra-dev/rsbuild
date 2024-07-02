import { isAbsolute, join } from 'node:path';
import type {
  InspectConfigOptions,
  InspectConfigResult,
  RspackConfig,
} from '@rsbuild/shared';
import {
  getRsbuildInspectConfig,
  outputInspectConfigFiles,
  stringifyConfig,
} from '../config';
import { getNodeEnv, setNodeEnv } from '../helpers';
import { type InitConfigsOptions, initConfigs } from './initConfigs';

export async function inspectConfig({
  context,
  pluginManager,
  rsbuildOptions,
  bundlerConfigs,
  inspectOptions = {},
}: InitConfigsOptions & {
  inspectOptions?: InspectConfigOptions;
  bundlerConfigs?: RspackConfig[];
}): Promise<InspectConfigResult<'rspack'>> {
  if (inspectOptions.env) {
    setNodeEnv(inspectOptions.env);
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

  let outputPath = inspectOptions.outputPath
    ? join(context.distPath, inspectOptions.outputPath)
    : context.distPath;
  if (!isAbsolute(outputPath)) {
    outputPath = join(context.rootPath, outputPath);
  }

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
