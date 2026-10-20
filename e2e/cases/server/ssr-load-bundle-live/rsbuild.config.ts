import vm from 'node:vm';
import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    target: 'node',
    module: true,
    externals: ['runner-live'],
  },
  server: {
    setup({ server, action }) {
      if (action !== 'dev') {
        return;
      }
      server.middlewares.use('/check', async (_req, res) => {
        try {
          const bundle = await server.environments.node.loadBundle<{
            observe: () => Promise<unknown>;
          }>('index');
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              nativeVm: Boolean(vm.SourceTextModule),
              result: await bundle.observe(),
            }),
          );
        } catch (error) {
          res.statusCode = 500;
          res.end(String(error));
        }
      });
    },
  },
  environments: { node: {} },
});
