import { dualPackage } from '@rsbuild/config/rslib.config.ts';
import { defineConfig } from '@rslib/core';

const externals = [
    'builtin:rsc-client-reference-manifest-loader!',
    'builtin:rsc-server-reference-manifest-loader!',
    'react-server-dom-webpack/client',
    'react-server-dom-webpack/server',
    'react-server-dom-webpack/client.browser'
]

export default defineConfig({
  ...dualPackage,
  lib: [
    ...dualPackage.lib,
    {
      format: 'esm',
      experiments: {
        advancedEsm: true,
      },
      source: {
        entry: {
          rsc: './src/rsc.ts',
        },
      },
      output: {
        filename: {
          js: '[name].mjs',
        },
        externals
      },
    },
    {
      format: 'esm',
      experiments: {
        advancedEsm: true,
      },
      source: {
        entry: {
          ssr: './src/ssr.ts',
        },
      },
      output: {
        filename: {
          js: '[name].mjs',
        },
        externals
      },
    },
    {
      format: 'esm',
      experiments: {
        advancedEsm: true,
      },
      source: {
        entry: {
          client: './src/client.ts',
        },
      },
      output: {
        filename: {
          js: '[name].mjs',
        },
        externals
      },
    },
  ],
});
