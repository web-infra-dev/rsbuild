import { join, isAbsolute } from 'path';
import {
  BundlerType,
  InspectConfigOptions,
  outputInspectConfigFiles,
  stringifyConfig,
  BuilderContext,
  CreateBuilderOptions,
} from '@rsbuild/shared';

export async function inspectConfig<
  BundlerConfig,
  Context extends BuilderContext & {
    config: unknown;
  },
>({
  context,
  builderOptions,
  bundlerConfigs,
  inspectOptions = {},
  bundlerType,
  initConfigs,
}: {
  builderOptions: Required<CreateBuilderOptions>;
  context: Context;
  initConfigs: () => Promise<BundlerConfig[]>;
  inspectOptions?: InspectConfigOptions;
  bundlerConfigs?: BundlerConfig[];
  bundlerType: BundlerType;
}) {
  if (inspectOptions.env) {
    process.env.NODE_ENV = inspectOptions.env;
  } else if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  const originBundlerConfigs = bundlerConfigs || (await initConfigs());

  const rawBuilderConfig = await stringifyConfig(
    context.config,
    inspectOptions.verbose,
  );
  const rawBundlerConfigs = await Promise.all(
    originBundlerConfigs.map((config) =>
      stringifyConfig(config, inspectOptions.verbose),
    ),
  );

  let outputPath = inspectOptions.outputPath || context.distPath;
  if (!isAbsolute(outputPath)) {
    outputPath = join(context.rootPath, outputPath);
  }

  if (inspectOptions.writeToDisk) {
    await outputInspectConfigFiles({
      builderConfig: rawBuilderConfig,
      bundlerConfigs: rawBundlerConfigs,
      inspectOptions: {
        ...inspectOptions,
        outputPath,
      },
      builderOptions,
      configType: bundlerType,
    });
  }

  return {
    builderConfig: rawBuilderConfig,
    bundlerConfigs: rawBundlerConfigs,
    origin: {
      builderConfig: context.config as Context['config'],
      bundlerConfigs: originBundlerConfigs,
    },
  };
}
