import { dirname } from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginCheckSyntax } from '@rsbuild/plugin-check-syntax';

export default defineConfig({
  plugins: [pluginCheckSyntax()],
  source: {
    include: [dirname(require.resolve('test'))],
  },
  output: {
    overrideBrowserslist: ['Chrome >= 51'],
  },
});
