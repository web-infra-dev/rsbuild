import { defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginVue2 } from '@rsbuild/plugin-vue2';
import { pluginVue2Jsx } from '@rsbuild/plugin-vue2-jsx';

export default defineConfig({
  plugins: [
    pluginVue2(),
    pluginVue2Jsx(),
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
      exclude: /[\\/]node_modules[\\/]/,
    }),
  ],
});
