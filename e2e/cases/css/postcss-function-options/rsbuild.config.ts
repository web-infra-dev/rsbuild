import path from 'node:path';
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
        const name = loaderContext.resourcePath.includes('foo') ? 'foo' : 'bar';
        const config = path.join(__dirname, `./tailwind.config.${name}.cjs`);
        return {
          plugins: [require('tailwindcss')({ config })],
        };
      },
    },
  },
});
