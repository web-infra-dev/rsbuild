import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginReactRouter } from '@rsbuild/plugin-react-router';
import { cloudflareDevProxy } from './plugins/cloudflare-dev-proxy';

export default defineConfig({
  environments: {
    node: {
      tools: {
        rspack: {
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
  plugins: [
    cloudflareDevProxy({
      getLoadContext({ context }) {
        return { cloudflare: context.cloudflare };
      },
    }),
    pluginReactRouter(),
    pluginReact(),
  ],
});
