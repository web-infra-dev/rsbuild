import { esmConfig } from '@scripts/config/lib';
import { baseConfig } from '@scripts/config/test';
import { define } from 'rstack';

define.lib({
  lib: [
    esmConfig,
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
