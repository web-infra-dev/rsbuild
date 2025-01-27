import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  dev: {
    writeToDisk: true,
  },
  output: {
    filenameHash: false,
    overrideBrowserslist: ['Chrome >= 53'],
  },
  tools: {
    lightningcssLoader: {
      exclude: {
        logicalProperties: true,
      },
    },
  },
});
