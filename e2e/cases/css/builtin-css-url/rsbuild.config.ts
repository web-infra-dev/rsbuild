import { defineConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSass } from '@rsbuild/plugin-sass';

const addPostcssMarker = () => ({
  postcssPlugin: 'add-postcss-marker',
  Declaration(decl: { prop: string; cloneBefore: (decl: object) => void }) {
    if (decl.prop === 'color') {
      decl.cloneBefore({
        prop: '--postcss-transformed',
        value: 'true',
      });
    }
  },
});

addPostcssMarker.postcss = true;

export default defineConfig({
  css: true,
  // TODO: Re-enable build cache when changes to CSS options invalidate cached CSS URLs.
  performance: { buildCache: false },
  output: {
    filenameHash: false,
  },
  tools: {
    postcss(_, { addPlugins }) {
      addPlugins(addPostcssMarker);
    },
  },
  plugins: [pluginLess(), pluginSass()],
});
