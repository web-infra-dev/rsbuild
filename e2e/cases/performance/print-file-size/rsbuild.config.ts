import { pluginReact } from '@rsbuild/plugin-react';

export default {
  plugins: [pluginReact()],
  output: {
    filenameHash: false,
  },
  performance: {
    printFileSize: true,
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
        distPath: {
          root: 'dist/server',
        },
      },
    },
  },
};
