import { fse } from '@rsbuild/shared';
import { join, isAbsolute } from 'path';
import type { RsbuildPlugin } from '../types';

// For Rsbuild Server Config
export const pluginServer = (): RsbuildPlugin => ({
  name: 'rsbuild:server',

  setup(api) {
    api.onBeforeBuild(async () => {
      const config = api.getNormalizedConfig();

      if (config.server?.publicDir) {
        const { name, copyOnBuild } = config.server?.publicDir;

        if (!copyOnBuild || !name) {
          return;
        }

        const publicDir = isAbsolute(name)
          ? name
          : join(api.context.rootPath, name);

        if (!fse.existsSync(publicDir)) {
          return;
        }

        await fse.copy(publicDir, api.context.distPath, {
          // dereference symlinks
          dereference: true,
        });
      }
    });
  },
});
