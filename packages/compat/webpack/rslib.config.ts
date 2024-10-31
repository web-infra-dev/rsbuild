import path from 'node:path';
import { pureEsmPackage } from '@rsbuild/config/rslib.config.ts';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...pureEsmPackage,
  output: {
    ...pureEsmPackage.output,
    copy: [
      {
        from: path.resolve(__dirname, 'src/index.cjs'),
      },
    ],
  },
});
