import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    module: true,
    target: 'node',
    filenameHash: false,
  },
});
