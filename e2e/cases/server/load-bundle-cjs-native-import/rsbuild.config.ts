import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  server: {
    setup: ({ action, server }) => {
      if (action !== 'dev') {
        return;
      }

      server.middlewares.use('/check', async (_req, res) => {
        const getFilename =
          await server.environments.node.loadBundle<() => Promise<string>>(
            'index',
          );

        res.end(await getFilename());
      });
    },
  },
  environments: {
    node: {
      output: {
        target: 'node',
        module: false,
        externals: {
          'node:path': 'import node:path',
        },
      },
      source: {
        entry: {
          index: './src/index.server.cjs',
        },
      },
    },
  },
});
