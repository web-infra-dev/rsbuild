import type { Minify } from '@rsbuild/core';
import { defineConfig, type LibConfig } from '@rslib/core';
import { pluginAreTheTypesWrong } from 'rsbuild-plugin-arethetypeswrong';

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
    // Only use tsgo in local dev for faster build, disable it in CI until it's more stable
    tsgo: !process.env.CI,
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
  plugins: [
    pluginAreTheTypesWrong({
      enable: Boolean(process.env.CI),
      areTheTypesWrongOptions: {
        ignoreRules: [
          // The dual package always provide the ESM types.
          'false-esm',
        ],
      },
    }),
  ],
});
