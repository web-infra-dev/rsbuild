import { join } from 'node:path';
import { deepmerge, getCoreJsVersion } from '@rsbuild/shared';
import { generateBaseConfig } from './base';
import type { BabelConfig, WebPresetOptions } from './types';

const getDefaultPresetEnvOption = (options: WebPresetOptions) => {
  if (options.presetEnv === false) {
    return false;
  }

  return {
    bugfixes: true,
    // core-js is required for web target
    corejs: options.presetEnv?.useBuiltIns
      ? {
          version: getCoreJsVersion(require.resolve('core-js/package.json')),
          proposals: true,
        }
      : undefined,
  };
};

export const getBabelConfigForWeb = (options: WebPresetOptions) => {
  const mergedOptions = deepmerge(
    {
      presetEnv: getDefaultPresetEnvOption(options),
    },
    options,
  );

  const config = generateBaseConfig(mergedOptions);
  const { pluginTransformRuntime = {} } = mergedOptions;

  // Skip plugin-transform-runtime when testing
  if (pluginTransformRuntime) {
    config.plugins?.push([
      require.resolve('@babel/plugin-transform-runtime'),
      {
        version: require('@babel/runtime/package.json').version,
        // this option has been deprecated
        // but enabling it can help to reduce bundle size
        useESModules: true,
        ...pluginTransformRuntime,
      },
    ]);
  }

  config.plugins?.push(join(__dirname, './pluginLockCorejsVersion'));

  return config;
};

export default function (
  api: { cache: (flag: boolean) => void },
  options: WebPresetOptions,
): BabelConfig {
  api.cache(true);
  return getBabelConfigForWeb(options);
}
