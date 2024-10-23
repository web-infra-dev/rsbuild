import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    filename: {
      js: (pathData) => {
        if (pathData.chunk?.name === 'index') {
          return 'my-index.js';
        }

        return '/some-path/[name].js';
      },
      css: (pathData) => {
        if (pathData.chunk?.name === 'index') {
          return 'my-index.css';
        }
        return '/some-path/[name].css';
      },
    },
  },
});
