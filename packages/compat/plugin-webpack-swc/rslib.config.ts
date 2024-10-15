import { dualPackage } from '@rsbuild/config/rslib.config.ts';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...dualPackage,
  lib: [
    ...dualPackage.lib.map((config) => {
      if (config.format === 'cjs') {
        config.source = {
          entry: {
            index: './src/index.ts',
            loader: './src/loader.ts',
          },
        };
      }
      return config;
    }),
  ],
});
