import { join, isAbsolute } from 'node:path';
import { initConfigs, type InitConfigsOptions } from './initConfigs';
import {
  setNodeEnv,
  getNodeEnv,
  stringifyConfig,
  outputInspectConfigFiles,
  type RspackConfig,
  type NormalizedConfig,
  type InspectConfigResult,
  type InspectConfigOptions,
} from '@rsbuild/shared';

export async function inspectConfig({
  context,
  pluginStore,
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
        pluginStore,
        rsbuildOptions,
      })
    ).rspackConfigs;

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
