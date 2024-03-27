import { dependencies } from './package.json';
import type { Rspack } from '@rsbuild/core';

export const mfConfig: Rspack.ModuleFederationPluginOptions = {
  name: 'remote',
  exposes: {
    './Button': './src/Button',
  },
  filename: 'remoteEntry.js',
  shared: {
    ...dependencies,
    react: {
      singleton: true,
      requiredVersion: dependencies.react,
    },
    'react/': {},
    'react-dom/': {},
    'react-dom': {
      singleton: true,
      requiredVersion: dependencies['react-dom'],
    },
  },
  runtimePlugins: [require.resolve('./runtimePlugin.js')],
};
