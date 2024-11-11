import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    // Client / ESM
    {
      format: 'esm',
      syntax: 'es2017',
      source: {
        entry: {
          hmr: 'src/client/hmr.ts',
          overlay: 'src/client/overlay.ts',
        },
        define: {
          WEBPACK_HASH: '__webpack_hash__',
        },
      },
      output: {
        target: 'web',
        externals: ['./hmr'],
        distPath: {
          root: './dist/client',
        },
      },
    },
  ],
});
