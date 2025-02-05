import type { RsbuildConfig } from '@rsbuild/core';

export default {
  output: {
    distPath: {
      root: 'dist-custom',
    },
  },
} satisfies RsbuildConfig;
