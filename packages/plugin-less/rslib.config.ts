import { pureEsmPackage } from '@scripts/config/rslib.config.ts';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...pureEsmPackage,
  output: {
    externals: /[\\/]compiled[\\/]/,
  },
});
