import { esmConfig, esmLibConfig } from '@scripts/config/lib';
import { baseConfig } from '@scripts/config/test';
import { define } from 'rstack';

define.lib({
  exports: esmConfig.exports,
  lib: [
    esmLibConfig,
    {
      source: {
        entry: {
          assetLoader: './src/assetLoader.ts',
          loader: './src/loader.ts',
        },
      },
      output: {
        filename: {
          js: '[name].mjs',
        },
      },
    },
  ],
});

define.test(baseConfig);
