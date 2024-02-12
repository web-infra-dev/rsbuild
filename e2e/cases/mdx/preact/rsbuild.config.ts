import { defineConfig } from '@rsbuild/core';
import { pluginPreact } from '@rsbuild/plugin-preact';
import { pluginMdx } from '@rsbuild/plugin-mdx';

export default defineConfig({
  plugins: [
    pluginPreact(),
    pluginMdx({
      mdxLoaderOptions: {
        jsxImportSource: 'preact',
      },
    }),
  ],
});
