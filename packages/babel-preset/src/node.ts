import { deepmerge } from '@rsbuild/shared';
import { generateBaseConfig } from './base';
import type { BabelConfig, NodePresetOptions } from './types';

export const getBabelConfigForNode = (options: NodePresetOptions = {}) => {
  let mergedOptions = options;

  if (!options.presetEnv || !options.presetEnv.targets) {
    mergedOptions = deepmerge(
      {
        presetEnv: {
          targets: ['node >= 16'],
        },
      },
      options,
    );
  }

  const config = generateBaseConfig(mergedOptions);

  config.plugins?.push(require.resolve('babel-plugin-dynamic-import-node'));

  return config;
};

export default function (
  api: { cache: (flag: boolean) => void },
  options: NodePresetOptions = {},
): BabelConfig {
  api.cache(true);
  return getBabelConfigForNode(options);
}
