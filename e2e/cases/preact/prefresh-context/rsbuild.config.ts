import { pluginPreact } from '@rsbuild/plugin-preact';

export default {
  plugins: [
    pluginPreact({
      exclude: [
        /node_modules/,
        // exclude Rsbuild internal HMR client
        /packages\/core\/dist/,
      ],
    }),
  ],
};
