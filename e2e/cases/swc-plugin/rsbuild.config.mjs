import { createRequire } from 'node:module';
import { defineConfig } from '@rsbuild/core';

const require = createRequire(import.meta.url);

export default defineConfig({
  tools: {
    swc: {
      jsc: {
        experimental: {
          plugins: [
            [
              require.resolve('@swc/plugin-remove-console'),
              {
                exclude: ['error'],
              },
            ],
          ],
        },
      },
    },
  },
});
