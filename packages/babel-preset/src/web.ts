import { getCoreJsVersion } from '@rsbuild/shared';
import { lodash } from '@rsbuild/shared/lodash';
import { generateBaseConfig } from './base';
import type { BabelOptions, WebPresetOptions } from './types';

export default function (api: any, options: WebPresetOptions): BabelOptions {
  api.cache(true);

  const mergedOptions = lodash.merge(
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

  return config;
}
