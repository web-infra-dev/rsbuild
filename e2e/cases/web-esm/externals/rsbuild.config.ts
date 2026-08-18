import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    module: true,
    externals: {
      'external-module': 'external-module',
    },
  },
  html: {
    tags: [
      {
        tag: 'script',
        attrs: {
          type: 'importmap',
        },
        children: JSON.stringify({
          imports: {
            'external-module': '/external.js',
          },
        }),
        append: false,
      },
    ],
  },
});
