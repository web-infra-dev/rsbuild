import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginReactRouter } from '@rsbuild/plugin-react-router';
import { pluginTypedCSSModules } from '@rsbuild/plugin-typed-css-modules';

export default defineConfig({
  tools: {
    rspack: (config) => {
      config.devtool = false;
      return config;
    },
  },
  plugins: [
    pluginReactRouter({
      ssr: true,
      // React Router specific options
      router: {
        staticHandler: true, // Enable static handler for React Router
        dataRouter: true, // Enable data router for React Router
      },
    }),
    pluginReact(),
    pluginTypedCSSModules(),
  ],
});
