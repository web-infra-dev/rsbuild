import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';
import { pluginMdx } from '@rsbuild/plugin-mdx';

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
