import { join } from 'path';
import { deepmerge, getCoreJsVersion } from '@rsbuild/shared';
import { generateBaseConfig } from './base';
import type { BabelConfig, WebPresetOptions } from './types';

export const getBabelConfigForWeb = (options: WebPresetOptions) => {
  const mergedOptions = deepmerge(
    {
      presetEnv: {
        bugfixes: true,
        corejs: options.presetEnv?.useBuiltIns
          ? {
              version: getCoreJsVersion(
                require.resolve('core-js/package.json'),
              ),
              proposals: true,
            }
          : undefined,
      },
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
