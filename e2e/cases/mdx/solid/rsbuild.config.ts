import { defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginSolid } from '@rsbuild/plugin-solid';
import { pluginMdx } from '@rsbuild/plugin-mdx';

export default defineConfig({
  plugins: [
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
      exclude: /[\\/]node_modules[\\/]/,
    }),
    pluginSolid(),
    pluginMdx({
      mdxLoaderOptions: {
        jsxImportSource: 'solid-js/h',
      },
    }),
  ],
});
