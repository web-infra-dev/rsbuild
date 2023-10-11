import { deepmerge } from '@rsbuild/shared/deepmerge';
import { generateBaseConfig } from './base';
import type { BabelOptions, NodePresetOptions } from './types';

export const getBabelPresetForNode = (options: NodePresetOptions = {}) => {
  const mergedOptions = deepmerge(
    {
      presetEnv: {
        targets: ['node >= 14'],
      },
    },
    options,
  );

  const config = generateBaseConfig(mergedOptions);

  return config;
};

export default function (
  api: { cache: (flag: boolean) => void },
  options: NodePresetOptions = {},
): BabelOptions {
  api.cache(true);
  return getBabelPresetForNode(options);
}
