import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginReactRouter } from '@rsbuild/plugin-react-router';

export default defineConfig({
  environments: {
    node: {
      performance: {
        // cloudflare cannot support dynamic chunk split in worker
        chunkSplit: { strategy: 'all-in-one' },
      },
      tools: {
        rspack: {
          // must use esm module output
          experiments: {
            outputModule: true,
          },
          externalsType: 'module',
          output: {
            chunkFormat: 'module',
            chunkLoading: 'import',
            workerChunkLoading: 'import',
            wasmLoading: 'fetch',
            library: { type: 'module' },
            module: true,
          },
          resolve: {
            conditionNames: [
              'workerd',
              'worker',
              'browser',
              'import',
              'require',
            ],
          },
        },
      },
    },
  },
  plugins: [pluginReactRouter(), pluginReact()],
});
