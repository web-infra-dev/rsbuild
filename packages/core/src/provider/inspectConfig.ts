import { isAbsolute, join } from 'node:path';
import type {
  InspectConfigOptions,
  InspectConfigResult,
  NormalizedConfig,
  RspackConfig,
} from '@rsbuild/shared';
import { outputInspectConfigFiles, stringifyConfig } from '../config';
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

  const rsbuildDebugConfig: NormalizedConfig & {
    pluginNames: string[];
  } = {
    ...context.normalizedConfig!,
    pluginNames: pluginManager.getPlugins().map((p) => p.name),
  };

  const rawRsbuildConfig = await stringifyConfig(
    rsbuildDebugConfig,
    inspectOptions.verbose,
  );

  const rawBundlerConfigs = await Promise.all(
    rspackConfigs.map(async (config, index) => ({
      name: config.name || String(index),
      content: await stringifyConfig(config, inspectOptions.verbose),
    })),
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
    bundlerConfigs: rawBundlerConfigs.map((r) => r.content),
    origin: {
      rsbuildConfig: rsbuildDebugConfig,
      bundlerConfigs: rspackConfigs,
    },
  };
}
