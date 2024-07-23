import { defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginVue } from '@rsbuild/plugin-vue';
import { pluginVueJsx } from '@rsbuild/plugin-vue-jsx';

export default defineConfig({
  environments: {
    react: {
      plugins: [pluginReact()],
      source: {
        entry: {
          react: './src/react/index.ts',
        },
      },
    },
    vue: {
      plugins: [
        pluginVue(),
        pluginVueJsx(),
        pluginBabel({
          include: /\.(?:jsx|tsx)$/,
        }),
      ],
      source: {
        entry: {
          vue: './src/vue/index.js',
        },
      },
    },
  },
});
