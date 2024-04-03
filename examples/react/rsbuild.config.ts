import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  tools: {
    rspack: {
      module: {
        rules: [
          {
            issuer: {
              and: [
                '<ROOT>/packages/core/tests',
                {
                  not: /\\[\\\\\\\\/\\]node_modules\\[\\\\\\\\/\\]/,
                },
              ],
            },
          },
        ],
      },
    },
  },
});
