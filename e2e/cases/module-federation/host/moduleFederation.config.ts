import type { Rspack } from '@rsbuild/core';

export const mfConfig: Rspack.ModuleFederationPluginOptions = {
  name: 'host',
  remotes: {
    remote: `remote@http://localhost:${process.env.REMOTE_PORT || 3002}/remoteEntry.js`,
  },
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
