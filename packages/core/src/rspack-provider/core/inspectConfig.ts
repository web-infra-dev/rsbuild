import { join, isAbsolute } from 'path';
import { initConfigs, type InitConfigsOptions } from './initConfigs';
import {
  stringifyConfig,
  outputInspectConfigFiles,
  type RspackConfig,
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
}) {
  if (inspectOptions.env) {
    process.env.NODE_ENV = inspectOptions.env;
  } else if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
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

  const rawRsbuildConfig = await stringifyConfig(
    context.config,
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
      rsbuildConfig: rawRsbuildConfig,
      bundlerConfigs: rawBundlerConfigs,
      inspectOptions: {
        ...inspectOptions,
        outputPath,
      },
      rsbuildOptions,
      configType: 'rspack',
    });
  }

  return {
    rsbuildConfig: rawRsbuildConfig,
    bundlerConfigs: rawBundlerConfigs,
    origin: {
      rsbuildConfig: context.config,
      bundlerConfigs: rspackConfigs,
    },
  };
}
