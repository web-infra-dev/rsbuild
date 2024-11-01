import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    alias: {
      '@common': './src/common2',
    },
    tsconfigPath: 'tsconfig.custom.json',
  },
});
