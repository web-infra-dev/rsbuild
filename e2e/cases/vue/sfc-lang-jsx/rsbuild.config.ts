import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';
import { pluginVueJsx } from '@rsbuild/plugin-vue-jsx';
import { pluginBabel } from '@rsbuild/plugin-babel';

export default defineConfig({
  plugins: [
    pluginVue(),
    pluginVueJsx(),
    pluginBabel({
      include: /\.(jsx|tsx)$/,
      exclude: /[\\/]node_modules[\\/]/,
    }),
  ],
});
