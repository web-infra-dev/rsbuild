import { dualPackage } from '@rsbuild/config/rslib.config.ts';
import { defineConfig } from '@rslib/core';
import pkgJson from './package.json';

export default defineConfig({
  ...dualPackage,
  source: {
    define: {
      RSBUILD_VERSION: JSON.stringify(pkgJson.version.replace(/\./g, '-')),
    },
  },
});
