import { defineConfig } from '@rsbuild/core';

const createPostcssPlugin = (color) => {
  const plugin = () => ({
    postcssPlugin: 'simple-postcss-plugin',
    Declaration(decl) {
      if (typeof decl.value === 'string') {
        decl.value = decl.value.replace(/red/g, color);
      }
    },
  });
  plugin.postcss = true;
  return plugin;
};

export default defineConfig({
  tools: {
    postcss(_, { addPlugins }) {
      addPlugins(createPostcssPlugin('blue'));
      addPlugins(createPostcssPlugin('green'), { order: 'pre' });
    },
  },
});
