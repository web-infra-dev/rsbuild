import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    transformImport: [
      {
        libraryName: 'lodash',
        customName: 'lodash/{{ member }}',
      },
    ],
  },
  splitChunks: false,
});
