import { defineConfig } from '@rsbuild/core';
import { myPlugin } from './myPlugin';

export default defineConfig({
  plugins: [myPlugin],
  environments: {
    web: {
      output: {
        target: 'web',
        filenameHash: false,
      },
    },
    node: {
      output: {
        target: 'node',
        distPath: {
          root: 'dist/server',
        },
      },
    },
  },
});
