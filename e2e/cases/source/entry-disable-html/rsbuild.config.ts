export default {
  source: {
    entry: {
      foo: {
        import: './src/foo.js',
      },
      bar: {
        import: './src/bar.js',
        filename: 'bar.js',
        html: false,
      },
    },
  },
};
