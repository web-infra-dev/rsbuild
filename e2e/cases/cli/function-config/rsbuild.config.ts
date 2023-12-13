import { defineConfig } from '@rsbuild/core';

export default defineConfig(({ env, command }) => ({
  output: {
    distPath: {
      root: `dist-${env}-${command}`,
    },
  },
}));
