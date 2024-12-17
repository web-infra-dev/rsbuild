import fs from 'node:fs';
import path from 'node:path';
import type { Minify, RsbuildPlugin } from '@rsbuild/core';
import { type LibConfig, defineConfig } from '@rslib/core';

export const commonExternals: Array<string | RegExp> = [
  'webpack',
  /[\\/]compiled[\\/]/,
];

export const nodeMinifyConfig: Minify = {
  js: true,
  css: false,
  jsOptions: {
    minimizerOptions: {
      // preserve variable name and disable minify for easier debugging
      mangle: false,
      minify: false,
      compress: false,
    },
  },
};

// Clean tsc cache to ensure the dts files can be generated correctly
export const pluginCleanTscCache: RsbuildPlugin = {
  name: 'plugin-clean-tsc-cache',
  setup(api) {
    api.onBeforeBuild(() => {
      const tsbuildinfo = path.join(
        api.context.rootPath,
        'tsconfig.tsbuildinfo',
      );
      if (fs.existsSync(tsbuildinfo)) {
        fs.rmSync(tsbuildinfo);
      }
    });
  },
};

export const esmConfig: LibConfig = {
  format: 'esm',
  syntax: 'es2021',
  dts: {
    build: true,
  },
  plugins: [pluginCleanTscCache],
  output: {
    minify: nodeMinifyConfig,
  },
};

export const cjsConfig: LibConfig = {
  format: 'cjs',
  syntax: 'es2021',
  output: {
    minify: nodeMinifyConfig,
  },
};

export const dualPackage = defineConfig({
  lib: [esmConfig, cjsConfig],
  tools: {
    rspack: {
      externals: commonExternals,
    },
  },
});
