import type { Rspack } from '@rsbuild/core';

export const mfConfig: Rspack.ModuleFederationPluginOptions = {
  name: 'remote',
  exposes: {
    './Button': './src/Button',
  },
  filename: 'remoteEntry.js',
  shared: {
    react: {
      singleton: true,
      requiredVersion: '^19.0.0',
    },
    'react-dom': {
      singleton: true,
      requiredVersion: '^19.0.0',
    },
  },
};
