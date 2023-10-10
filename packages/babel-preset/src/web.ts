import { getCoreJsVersion } from '@rsbuild/shared';
import { generateBaseConfig, type BasePresetOptions } from './base';
import type { BabelOptions } from './types';

export type WebPresetOptions = BasePresetOptions & {
  useBuiltIns?: 'entry' | 'usage' | false;
  browserslist: string[];
};

export default function (api: any, options: WebPresetOptions): BabelOptions {
  api.cache(true);

  const config = generateBaseConfig(options);

  config.presets?.push([
    require.resolve('@babel/preset-env'),
    {
      targets: options.browserslist,
      modules: false,
      bugfixes: true,
      useBuiltIns: options.useBuiltIns,
      exclude: ['transform-typeof-symbol'],
      corejs: options.useBuiltIns
        ? {
            version: getCoreJsVersion(require.resolve('core-js/package.json')),
            proposals: true,
          }
        : undefined,
    },
  ]);

  return config;
}
