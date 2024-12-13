import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginReactRouter } from '@rsbuild/plugin-react-router';
import { pluginTypedCSSModules } from '@rsbuild/plugin-typed-css-modules';

export default defineConfig({
  plugins: [pluginReact(), pluginReactRouter(), pluginTypedCSSModules()],
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
      // html: {
      //   template: './index.html',
      // },
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
