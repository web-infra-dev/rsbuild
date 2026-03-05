import { defineConfig, type RequestHandler } from '@rsbuild/core';

export default defineConfig({
  server: {
    setup: ({ action, server }) => {
      if (action !== 'dev') {
        return;
      }

      const checkMiddleware: RequestHandler = async (req, res, next) => {
        if (req.method !== 'GET' || req.url !== '/check') {
          next();
          return;
        }

        try {
          const bundle = await server.environments.node.loadBundle<{
            helloType: string;
            result: string;
          }>('index');
          // @ts-expect-error
          const nativeModule = await import('esm-pkg');
          const nativeDefault = nativeModule.default;

          const payload = {
            loadBundleType: bundle.helloType,
            nativeType: typeof nativeDefault,
            loadBundleResult: bundle.result,
            nativeResult:
              typeof nativeDefault === 'function'
                ? nativeDefault()
                : `BUG: native default is ${typeof nativeDefault}`,
          };

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        } catch (error) {
          res.statusCode = 500;
          res.end(String(error));
        }
      };

      server.middlewares.use(checkMiddleware);
    },
  },
  environments: {
    web: {
      source: {
        entry: {
          index: './src/index.js',
        },
      },
    },
    node: {
      source: {
        entry: {
          index: './src/index.server.js',
        },
      },
      output: {
        target: 'node',
        externals: ['esm-pkg'],
      },
    },
  },
});
