import { defineConfig } from '@rsbuild/core';

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
