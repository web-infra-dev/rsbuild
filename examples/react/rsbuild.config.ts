import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { TempA } from '@scripts/test-helper/tempA';


export default defineConfig({
  plugins: [pluginReact()],
  dev: {
    setupMiddlewares: [
      (middlewares, server) => {
        middlewares.unshift((req, res, next) => {
          console.log(TempA);
          console.log('first111');
          next();
        });

        middlewares.push((req, res, next) => {
          console.log('last1111');
          next();
        });
      },
    ],

    watchFiles: {
      type: 'reload-server',
      paths: ['../../scripts/test-helper/dist/index.js'],
      options: {
        atomic: true,
      },
    },
  },
  tools: {
    rspack: {
      devServer: {
        devMiddleware: {
          cacheImmutable: false,
          cacheControl: false
        }
      }
    }
  },
  
  performance: {
    buildCache: false,
  },
});
