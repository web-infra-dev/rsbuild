import { lodash } from '@rsbuild/shared/lodash';
import { generateBaseConfig } from './base';
import type { BabelOptions, NodePresetOptions } from './types';

export default function (
  api: any,
  options: NodePresetOptions = {},
): BabelOptions {
  api.cache(true);

  const mergedOptions = lodash.merge(
    {
      presetEnv: {
        targets: ['node >= 14'],
      },
    },
    options,
  );

  const config = generateBaseConfig(mergedOptions);

  return config;
}
