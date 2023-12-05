import type { RsbuildPlugin } from '../../types';
import fs from 'fs';

// For Rsbuild Server Config
export const pluginServer = (): RsbuildPlugin => ({
  name: 'rsbuild:server',

  setup(api) {
    api.modifyBundlerChain(async (chain, { isProd }) => {
      const config = api.getNormalizedConfig();

      if (isProd && config.server?.publicDir) {
        const { name, copyOnBuild } = config.server?.publicDir;

        if (!copyOnBuild || !name) {
          return;
        }

        const publicPattern = [
          {
            from: name,
            to: '',
            noErrorOnMissing: true,
          },
        ];

        if (!fs.existsSync(name)) {
          return;
        }

        const { CopyRspackPlugin } = await import('@rspack/core');

        chain.plugin('public-dir').use(CopyRspackPlugin, [
          {
            patterns: publicPattern,
          },
        ]);
      }
    });
  },
});
