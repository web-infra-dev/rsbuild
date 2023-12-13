import type { RsbuildPlugin } from '../../types';
import fs from 'fs';
import { join, isAbsolute } from 'path';

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

        const publicDir = isAbsolute(name)
          ? name
          : join(api.context.rootPath, name);

        const publicPattern = [
          {
            from: publicDir,
            to: '',
            noErrorOnMissing: true,
          },
        ];

        if (!fs.existsSync(publicDir)) {
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
