import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    target: 'node',
    module: true,
    minify: false,
  },
});
