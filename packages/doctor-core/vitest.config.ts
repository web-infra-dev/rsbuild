import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

const config = defineConfig({
  resolve: {
    alias: [{ find: '@', replacement: resolve(__dirname, './src') }],
  },
});

export default config;
