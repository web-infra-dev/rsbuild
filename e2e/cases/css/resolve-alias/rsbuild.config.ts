import path from 'node:path';

export default {
  source: {
    alias: {
      '@common': path.resolve(__dirname, 'src/common'),
    },
  },
};
