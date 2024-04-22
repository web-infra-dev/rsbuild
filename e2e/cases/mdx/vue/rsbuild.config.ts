import { defineConfig } from '@rsbuild/core';
import { pluginMdx } from '@rsbuild/plugin-mdx';
import { pluginVue } from '@rsbuild/plugin-vue';

export default defineConfig({
  plugins: [
    pluginVue(),
    pluginMdx({
      mdxLoaderOptions: {
        jsxImportSource: 'vue',
      },
    }),
  ],
});
