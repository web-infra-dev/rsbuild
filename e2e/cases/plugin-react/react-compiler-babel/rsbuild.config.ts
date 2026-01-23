import { fileURLToPath } from 'node:url';
import { defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
      babelLoaderOptions(opts) {
        opts.plugins?.unshift(
          fileURLToPath(import.meta.resolve('babel-plugin-react-compiler')),
        );
      },
    }),
  ],
});
