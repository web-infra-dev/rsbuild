import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      experiments: {
        advancedEsm: true,
      },
      syntax: 'es2022',
    },
  ],
});
