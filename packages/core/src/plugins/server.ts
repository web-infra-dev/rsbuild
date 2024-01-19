import { fse, logger } from '@rsbuild/shared';
import { join, isAbsolute } from 'path';
import type { RsbuildPlugin } from '../types';

// For Rsbuild Server Config
export const pluginServer = (): RsbuildPlugin => ({
  name: 'rsbuild:server',

  setup(api) {
    api.onBeforeBuild(async () => {
      const config = api.getNormalizedConfig();

      if (config.server?.publicDir) {
        const { name, copyOnBuild } = config.server.publicDir;

        if (!copyOnBuild || !name) {
          return;
        }

        const publicDir = isAbsolute(name)
          ? name
          : join(api.context.rootPath, name);

        if (!fse.existsSync(publicDir)) {
          return;
        }

        try {
          // can not get useful error stack when copy error
          // so we manually catch and throw again
          await fse.copy(publicDir, api.context.distPath, {
            // dereference symlinks
            dereference: true,
          });
        } catch (err) {
          logger.error(`Copy public dir (${publicDir}) to dist failed:`, err);
        }
      }
    });
  },
});
