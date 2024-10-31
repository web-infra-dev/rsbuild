import { type LibConfig, defineConfig } from '@rslib/core';

export const commonExternals: Array<string | RegExp> = [
  'webpack',
  /[\\/]compiled[\\/]/,
];

export const esmConfig: LibConfig = {
  format: 'esm',
  syntax: 'es2021',
  dts: { bundle: false },
};

export const cjsConfig: LibConfig = {
  format: 'cjs',
  syntax: 'es2021',
};

export const dualPackage = defineConfig({
  lib: [esmConfig, cjsConfig],
  output: {
    target: 'node',
  },
  tools: {
    rspack: {
      externals: commonExternals,
    },
  },
});
