import { getCoreJsVersion } from '@rsbuild/shared';
import { deepmerge } from '@rsbuild/shared/deepmerge';
import { generateBaseConfig } from './base';
import type { BabelOptions, WebPresetOptions } from './types';

export const getBabelPresetForWeb = (options: WebPresetOptions) => {
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

  return generateBaseConfig(mergedOptions);
};

export default function (
  api: { cache: (flag: boolean) => void },
  options: WebPresetOptions,
): BabelOptions {
  api.cache(true);
  return getBabelPresetForWeb(options);
}
