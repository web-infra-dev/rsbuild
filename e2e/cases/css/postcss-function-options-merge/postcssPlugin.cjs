module.exports = () => {
  return {
    postcssPlugin: 'simple-postcss-plugin',
    Once(root) {
      root.prepend({
        type: 'atrule',
        name: 'tailwind',
        params: 'utilities',
      });
    },
  };
};

module.exports.postcss = true;
