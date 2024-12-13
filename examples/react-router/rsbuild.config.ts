import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  server: {
    htmlFallback: false,
  },
  environments: {
    // Client-side configuration
    web: {
      source: {
        entry: {
          client: './entry.client.tsx',
        },
      },
      plugins: [pluginReact()],
      output: {
        target: 'web',
        distPath: {
          root: 'dist/client',
        },
        filenameHash: false,
      },
      tools: {
        rspack: {
          experiments: {
            outputModule: true,
          },
          output: {
            module: true,
            chunkFormat: 'module',
            chunkLoading: 'import',
            library: {
              type: 'module',
            },
          },
          optimization: {
            runtimeChunk: 'single',
          },
        },
      },
    },
    // Server-side configuration
    node: {
      plugins: [pluginReact()],
      source: {
        entry: {
          server: './entry.server.tsx',
        },
      },
      output: {
        target: 'node',
        distPath: {
          root: 'dist/server',
        },
        filenameHash: false,
      },
      tools: {
        rspack: {
          target: 'node',
          experiments: {
            outputModule: true,
          },
          output: {
            module: true,
            chunkFormat: 'module',
            chunkLoading: 'import',
            library: {
              type: 'module',
            },
          },
        },
      },
    },
  },
});
