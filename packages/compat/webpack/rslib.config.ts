import {
  cjsConfig,
  dualPackage,
  esmConfig,
} from '@rsbuild/config/rslib.config.ts';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...dualPackage,
  lib: [
    esmConfig,
    {
      ...cjsConfig,
      output: {
        // TODO https://github.com/web-infra-dev/rslib/issues/287
        externals: {
          webpack: 'import webpack',
          'copy-webpack-plugin': 'import copy-webpack-plugin',
          'mini-css-extract-plugin': 'import mini-css-extract-plugin',
          'tsconfig-paths-webpack-plugin':
            'import tsconfig-paths-webpack-plugin',
        },
      },
      footer: {
        // TODO https://github.com/web-infra-dev/rslib/issues/351
        js: `// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = { webpackProvider: exports.webpackProvider });`,
      },
    },
  ],
});
