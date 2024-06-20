import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    alias(config, { target }) {
      if (target === 'web') {
        config['@common'] = './src/common';
      } else if (target === 'node') {
        config['@common'] = './src/common2';
      }
    },
  },
  output: {
    filenameHash: false,
  },
  environments: {
    web: {
      output: {
        target: 'web',
      },
    },
    node: {
      output: {
        target: 'node',
      },
    },
  },
});
