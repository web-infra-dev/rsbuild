import { dualPackage } from '@rsbuild/config/rslib.config.ts';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...dualPackage,
  output: {
    target: 'node',
    externals: {
      webpack: 'import webpack',
      'copy-webpack-plugin': 'import copy-webpack-plugin',
      'mini-css-extract-plugin': 'import mini-css-extract-plugin',
      'tsconfig-paths-webpack-plugin': 'import tsconfig-paths-webpack-plugin',
    },
  },
});
