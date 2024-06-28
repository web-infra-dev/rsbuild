import { defineConfig } from '@rsbuild/core';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';

export default defineConfig({
  plugins: [pluginTypeCheck()],
  environments: {
    web: {
      output: {
        target: 'web',
      },
    },
    node: {
      source: {
        tsconfigPath: './tsconfig.server.json',
      },
      output: {
        target: 'node',
      },
    },
  },
});
