import {
  cjsConfig,
  commonExternals,
  dualPackage,
  esmConfig,
} from '@rsbuild/config/rslib.config.ts';
import { defineConfig } from '@rslib/core';
const config = defineConfig({
  source: {
    entry: {
      index: './src/index.ts',
      'templates/entry.server': './src/templates/entry.server.tsx',
      'templates/entry.client': './src/templates/entry.client.tsx',
    },
  },
  lib: [esmConfig, cjsConfig],
  tools: {
    rspack: {
      externals: [
        ...commonExternals,
        'user-routes',
        /react-router-dom/,
        /react-router/,
        'react',
        /react-dom/,
      ],
    },
  },
});
export default config;
