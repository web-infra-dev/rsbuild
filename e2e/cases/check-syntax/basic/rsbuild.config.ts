import path from 'node:path';

export default {
  source: {
    exclude: [path.resolve(__dirname, './src/test.js')],
  },
  output: {
    sourceMap: {
      js: 'source-map',
    },
    overrideBrowserslist: ['ie 11'],
  },
};
