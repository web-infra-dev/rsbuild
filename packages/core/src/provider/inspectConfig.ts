import { isAbsolute, join } from 'node:path';
import {
  type InspectConfigOptions,
  type InspectConfigResult,
  type NormalizedConfig,
  type RspackConfig,
  getNodeEnv,
  outputInspectConfigFiles,
  setNodeEnv,
  stringifyConfig,
} from '@rsbuild/shared';
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

  const rsbuildDebugConfig: NormalizedConfig & {
    pluginNames: string[];
  } = {
    ...context.normalizedConfig!,
    pluginNames: pluginManager.plugins.map((p) => p.name),
  };

  const rawRsbuildConfig = await stringifyConfig(
    rsbuildDebugConfig,
    inspectOptions.verbose,
  );

  const rawBundlerConfigs = await Promise.all(
    rspackConfigs.map((config) =>
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
      configType: 'rspack',
    });
  }

  return {
    rsbuildConfig: rawRsbuildConfig,
    bundlerConfigs: rawBundlerConfigs,
    origin: {
      rsbuildConfig: rsbuildDebugConfig,
      bundlerConfigs: rspackConfigs,
    },
  };
}
