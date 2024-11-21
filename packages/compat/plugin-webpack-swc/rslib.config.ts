import { dualPackage } from '@rsbuild/config/rslib.config.ts';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...dualPackage,
  lib: [
    ...dualPackage.lib,
    {
      format: 'esm',
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
