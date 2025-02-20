import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: {
      foo: './src/foo/index.ts',
      bar: './src/bar/index.ts',
    },
  },
  html: {
    template({ entryName }) {
      return `./src/${entryName}/index.html`;
    },
  },
  tools: {
    postcss: {
      postcssOptions(loaderContext) {
        return {
          plugins: [
            tailwindcss({ base: loaderContext.context ?? import.meta.dirname }),
          ],
        };
      },
    },
  },
});
