import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginReactRouter } from '@rsbuild/plugin-react-router';
import 'react-router';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRequestListener } from '@react-router/node';
import type { ServerBuild } from 'react-router';

declare module 'react-router' {
  interface AppLoadContext {
    VALUE_FROM_EXPRESS: string;
  }
}

export default defineConfig(() => {
  return {
    dev: {
      setupMiddlewares: [
        (middlewares, server) => {
          middlewares.push(
            async (
              req: IncomingMessage,
              res: ServerResponse,
              next: (err?: any) => void,
            ) => {
              try {
                const bundle = (await server.environments.node.loadBundle(
                  'app',
                )) as ServerBuild;
                if (!bundle || !bundle.routes) {
                  throw new Error('Server bundle not found or invalid');
                }

                const listener = createRequestListener({ build: bundle });
                await listener(req, res);
              } catch (error) {
                console.error('SSR Error:', error);
                next(error);
              }
            },
          );
        },
      ],
    },
    plugins: [pluginReactRouter(), pluginReact()],
  };
});
