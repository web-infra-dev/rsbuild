import path from 'path';
import { defineConfig } from 'vitest/config';

const config = defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname),
      '@': path.resolve(__dirname, 'src'),
      '@builder': path.resolve(__dirname, '../builder/src'),
    },
  },
});

export default config;
