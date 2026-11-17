import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  output: {
    minify: false,
  },
  plugins: [
    pluginReact({
      reactCompiler: {
        include: /[\\/]src[\\/]features[\\/]/,
        exclude: /\.legacy\.jsx$/,
      },
    }),
  ],
});
