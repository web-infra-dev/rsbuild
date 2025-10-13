import { defineConfig } from '@rsbuild/core';

export default defineConfig(({ env, command }) => ({
  output: {
    distPath: `dist-${env}-${command}`,
  },
}));
