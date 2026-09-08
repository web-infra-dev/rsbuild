import { esmConfig, runtimeModeConfig } from '@scripts/config/lib';
import { baseConfig } from '@scripts/config/test';
import { define } from 'rstack';

define.lib({
  ...runtimeModeConfig,
  lib: [
    esmConfig,
    {
      source: {
        entry: {
          refreshLoader: './src/refreshLoader.ts',
          solidLoader: './src/solidLoader.ts',
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
