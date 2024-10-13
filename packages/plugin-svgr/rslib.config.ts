import { dualPackage } from '@rsbuild/config/rslib.config.ts';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...dualPackage,
  lib: [
    ...dualPackage.lib,
    {
      syntax: 'es2021',
      format: 'cjs',
      source: {
        entry: {
          loader: './src/loader.ts',
        },
      },
    },
  ],
});
