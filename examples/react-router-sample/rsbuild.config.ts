import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginReactRouter } from '@rsbuild/plugin-react-router';
import { pluginTypedCSSModules } from '@rsbuild/plugin-typed-css-modules';

export default defineConfig({
  plugins: [
    pluginReactRouter({
      // React Router specific options
      router: {
        staticHandler: true, // Enable static handler for React Router
        dataRouter: true, // Enable data router for React Router
      },
    }),
    pluginReact(),
    pluginTypedCSSModules(),
  ],
  environments: {
    // Configure the web environment for browsers
    web: {
      source: {
        entry: {
          client: './entry.client.tsx',
        },
      },
      output: {
        manifest: true,
        target: 'web',
      },
    },
    // Configure the node environment for SSR
    node: {
      source: {
        entry: {
          server: './entry.server.tsx',
        },
      },
      output: {
        target: 'node',
        manifest: false,
      },
    },
  },
});
