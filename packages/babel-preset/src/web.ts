import { join } from 'path';
import { getCoreJsVersion } from '@rsbuild/shared';
import { deepmerge } from '@rsbuild/shared/deepmerge';
import { generateBaseConfig } from './base';
import type { BabelConfig, WebPresetOptions } from './types';

export const getBabelConfigForWeb = (options: WebPresetOptions) => {
  const mergedOptions = deepmerge(
    {
      pluginTransformRuntime: {
        useESModules: true,
      },
      presetEnv: {
        bugfixes: true,
        corejs: options.presetEnv.useBuiltIns
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
