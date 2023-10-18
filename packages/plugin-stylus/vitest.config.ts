import { defineConfig } from 'vitest/config';
import path from 'path';

const config = defineConfig({
  resolve: {
    alias: {
      '@rspack-builder/tests': path.resolve(
        __dirname,
        '../builder-rspack-provider/tests',
      ),
    },
  },
});

export default config;
