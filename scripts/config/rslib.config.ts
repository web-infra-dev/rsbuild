import type { Minify } from '@rsbuild/core';
import { defineConfig, type LibConfig } from '@rslib/core';

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
      compress: true,
    },
  },
};

export const esmConfig: LibConfig = {
  format: 'esm',
  syntax: 'es2022',
  dts: {
    build: true,
  },
  output: {
    minify: nodeMinifyConfig,
  },
};

export const cjsConfig: LibConfig = {
  format: 'cjs',
  syntax: 'es2022',
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
