import { type RsbuildPlugin } from '@rsbuild/shared';
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

        const { default: CopyPlugin } = await import(
          '../../compiled/copy-webpack-plugin'
        );

        chain.plugin('public-dir').use(CopyPlugin, [
          {
            patterns: publicPattern,
          },
        ]);
      }
    });
  },
});
