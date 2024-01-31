import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { generateBaseConfig } from './base';
import type { BabelConfig, WebPresetOptions } from './types';
import type { PresetEnvOptions } from '@rsbuild/plugin-babel';

const getCoreJsVersion = (corejsPkgPath: string) => {
  try {
    const { version } = JSON.parse(readFileSync(corejsPkgPath, 'utf-8'));
    const [major, minor] = version.split('.');
    return `${major}.${minor}`;
  } catch (err) {
    return '3';
  }
};

const getDefaultPresetEnvOption = (
  options: WebPresetOptions,
): PresetEnvOptions | false => {
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
  if (options.presetEnv !== false) {
    options.presetEnv = {
      ...getDefaultPresetEnvOption(options),
      ...options.presetEnv,
    };
  }

  const config = generateBaseConfig(options);
  const { pluginTransformRuntime = {} } = options;

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
