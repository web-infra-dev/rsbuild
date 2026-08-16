import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  dev: {
    assetPrefix: 'auto',
  },
  output: {
    module: true,
    assetPrefix: 'auto',
  },
});
