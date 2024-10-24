import { defineConfig } from '@rslib/core';

export const commonExternals: Array<string | RegExp> = [
  'webpack',
  /[\\/]compiled[\\/]/,
];

export const dualPackage = defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2021',
      dts: { bundle: false },
    },
    { format: 'cjs', syntax: 'es2021' },
  ],
  output: {
    target: 'node',
  },
  tools: {
    rspack: {
      externals: commonExternals,
    },
  },
});
