import { generateBaseConfig, type BasePresetOptions } from './base';
import type { BabelOptions } from './types';

export type NodePresetOptions = BasePresetOptions & {
  //
};

export default function (
  api: any,
  options: NodePresetOptions = {},
): BabelOptions {
  api.cache(true);

  const config = generateBaseConfig(options);

  config.presets?.push([
    require.resolve('@babel/preset-env'),
    {
      modules: false,
      targets: ['node >= 14'],
      exclude: ['transform-typeof-symbol'],
    },
  ]);

  return config;
}
