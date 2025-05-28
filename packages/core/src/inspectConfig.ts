import fs from 'node:fs';
import { isAbsolute, join } from 'node:path';
import RspackChain from '../compiled/rspack-chain';
import { RSBUILD_OUTPUTS_PATH } from './constants';
import { color, getNodeEnv, setNodeEnv, upperFirst } from './helpers';
import { logger } from './logger';
import type { InitConfigsOptions } from './provider/initConfigs';
import type {
  InspectConfigOptions,
  InspectConfigResult,
  InternalContext,
  NormalizedConfig,
  NormalizedEnvironmentConfig,
  PluginManager,
  RsbuildPlugin,
  Rspack,
  WebpackConfig,
} from './types';

const normalizePluginObject = (plugin: RsbuildPlugin): RsbuildPlugin => {
  const { setup: _, ...rest } = plugin;
  return {
    ...rest,
    // use empty `setup` function as it's not meaningful in inspect config
    setup() {},
  };
};

export const getRsbuildInspectConfig = ({
  normalizedConfig,
  inspectOptions,
  pluginManager,
}: {
  normalizedConfig: NormalizedConfig;
  inspectOptions: InspectConfigOptions;
  pluginManager: PluginManager;
}): {
  rawRsbuildConfig: string;
  rsbuildConfig: InspectConfigResult['origin']['rsbuildConfig'];
  rawEnvironmentConfigs: Array<{
    name: string;
    content: string;
  }>;
  environmentConfigs: InspectConfigResult['origin']['environmentConfigs'];
} => {
  const { environments, ...rsbuildConfig } = normalizedConfig;

  const debugConfig: Omit<NormalizedConfig, 'environments'> = {
    ...rsbuildConfig,
    plugins: pluginManager.getPlugins().map(normalizePluginObject),
  };

  const rawRsbuildConfig = stringifyConfig(debugConfig, inspectOptions.verbose);
  const environmentConfigs: Record<string, NormalizedEnvironmentConfig> = {};

  const rawEnvironmentConfigs: Array<{
    name: string;
    content: string;
  }> = [];

  for (const [name, config] of Object.entries(environments)) {
    const debugConfig = {
      ...config,
      plugins: pluginManager
        .getPlugins({ environment: name })
        .map(normalizePluginObject),
    };
    rawEnvironmentConfigs.push({
      name,
      content: stringifyConfig(debugConfig, inspectOptions.verbose),
    });
    environmentConfigs[name] = debugConfig;
  }

  return {
    rsbuildConfig,
    rawRsbuildConfig,
    environmentConfigs: environments,
    rawEnvironmentConfigs,
  };
};

export async function outputInspectConfigFiles({
  rawBundlerConfigs,
  rawEnvironmentConfigs,
  inspectOptions,
  configType,
}: {
  configType: string;
  rawEnvironmentConfigs: Array<{
    name: string;
    content: string;
  }>;
  rawBundlerConfigs: Array<{
    name: string;
    content: string;
  }>;
  inspectOptions: InspectConfigOptions & {
    outputPath: string;
  };
}): Promise<void> {
  const { outputPath } = inspectOptions;

  const formatOutputName = (name: string) => name.replace(/[:]/g, '_');

  const files = [
    ...rawEnvironmentConfigs.map(({ name, content }) => {
      if (rawEnvironmentConfigs.length === 1) {
        const outputFile = 'rsbuild.config.mjs';
        const outputFilePath = join(outputPath, outputFile);

        return {
          path: outputFilePath,
          label: 'Rsbuild config',
          content,
        };
      }
      const outputFile = `rsbuild.config.${formatOutputName(name)}.mjs`;
      const outputFilePath = join(outputPath, outputFile);

      return {
        path: outputFilePath,
        label: `Rsbuild config (${name})`,
        content,
      };
    }),
    ...rawBundlerConfigs.map(({ name, content }) => {
      const outputFile = `${configType}.config.${formatOutputName(name)}.mjs`;
      let outputFilePath = join(outputPath, outputFile);

      // if filename is conflict, add a random id to the filename.
      if (fs.existsSync(outputFilePath)) {
        outputFilePath = outputFilePath.replace(/\.mjs$/, `.${Date.now()}.mjs`);
      }

      return {
        path: outputFilePath,
        label: `${upperFirst(configType)} Config (${name})`,
        content,
      };
    }),
  ];

  await fs.promises.mkdir(outputPath, { recursive: true });

  await Promise.all(
    files.map(async (item) => {
      return fs.promises.writeFile(item.path, `export default ${item.content}`);
    }),
  );

  const fileInfos = files
    .map(
      (item) =>
        `  - ${color.bold(color.yellow(item.label))}: ${color.underline(
          item.path,
        )}`,
    )
    .join('\n');

  logger.success(
    `config inspection completed, generated files: \n\n${fileInfos}\n`,
  );
}

export function stringifyConfig(config: unknown, verbose?: boolean): string {
  // webpackChain.toString can be used as a common stringify method
  const stringify = RspackChain.toString as (
    config: unknown,
    options: { verbose?: boolean },
  ) => string;

  return stringify(config, { verbose });
}

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

  return join(context.distPath, RSBUILD_OUTPUTS_PATH);
};

export async function inspectConfig<B extends 'rspack' | 'webpack' = 'rspack'>({
  context,
  pluginManager,
  bundlerConfigs,
  inspectOptions = {},
  bundler = 'rspack',
}: InitConfigsOptions & {
  inspectOptions?: InspectConfigOptions;
  bundlerConfigs: B extends 'rspack' ? Rspack.Configuration[] : WebpackConfig[];
  bundler?: 'rspack' | 'webpack';
}): Promise<InspectConfigResult<B>> {
  if (inspectOptions.mode) {
    setNodeEnv(inspectOptions.mode);
  } else if (!getNodeEnv()) {
    setNodeEnv('development');
  }

  const rawBundlerConfigs = bundlerConfigs.map((config, index) => ({
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
      configType: bundler,
    });
  }

  return {
    rsbuildConfig: rawRsbuildConfig,
    environmentConfigs: rawEnvironmentConfigs.map((r) => r.content),
    bundlerConfigs: rawBundlerConfigs.map((r) => r.content),
    origin: {
      rsbuildConfig,
      environmentConfigs,
      bundlerConfigs,
    },
  };
}
