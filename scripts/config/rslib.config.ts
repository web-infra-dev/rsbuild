import { defineConfig } from '@rslib/core';

export const commonExternals: Array<string | RegExp> = [
  'webpack',
  /[\\/]compiled[\\/]/,
];

export const dualPackage = defineConfig({
  lib: [
    {
      format: 'esm',
      dts: { bundle: false },
    },
    { format: 'cjs' },
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
