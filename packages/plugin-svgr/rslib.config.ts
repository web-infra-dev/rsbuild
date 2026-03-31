import { dualPackage } from '@scripts/config/rslib.config.ts';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...dualPackage,
  lib: [
    ...dualPackage.lib,
    {
      source: {
        entry: {
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
