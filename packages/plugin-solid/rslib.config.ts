import { esmConfig, nodeMinifyConfig } from '@scripts/config/rslib.config.ts';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    esmConfig,
    {
      format: 'cjs',
      syntax: 'es2023',
      output: {
        minify: nodeMinifyConfig,
      },
    },
  ],
});
