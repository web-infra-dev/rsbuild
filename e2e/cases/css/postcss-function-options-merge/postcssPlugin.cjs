module.exports = () => {
  return {
    postcssPlugin: 'simple-postcss-plugin',
    Once(root) {
      root.prepend({
        type: 'atrule',
        name: 'import',
        params: '"tailwindcss"',
      });
    },
  };
};

module.exports.postcss = true;
