import { fileURLToPath } from 'node:url';
import { defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  output: {
    minify: false,
  },
  plugins: [
    pluginReact(),
    pluginBabel({
      include: /\.[jt]sx?$/,
      exclude: [/[\\/]node_modules[\\/]/],
      babelLoaderOptions(opts) {
        opts.plugins?.unshift(
          fileURLToPath(import.meta.resolve('babel-plugin-react-compiler')),
        );
      },
    }),
  ],
});
