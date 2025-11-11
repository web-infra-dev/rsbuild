import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    target: 'node',
    module: true,
    overrideBrowserslist: ['Android >= 4.0'],
    distPath: process.env.NODE_ENV === 'production' ? 'dist-build' : 'dist-dev',
  },
  dev: {
    writeToDisk: true,
  },
});
