import { pluginReact } from '@rsbuild/plugin-react';

export default {
  // TODO: Re-enable build cache when HMR preserves the other environment's page with cached builds.
  performance: { buildCache: false },
  plugins: [pluginReact()],
  environments: {
    foo: {
      source: {
        entry: {
          foo: './src/foo.js',
        },
      },
    },
    bar: {
      source: {
        entry: {
          bar: './src/bar.js',
        },
      },
    },
  },
};
