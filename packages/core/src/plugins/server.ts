import fs from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { normalizePublicDirs } from '../config';
import type { RsbuildPlugin } from '../types';

// For Rsbuild Server Config
export const pluginServer = (): RsbuildPlugin => ({
  name: 'rsbuild:server',

  setup(api) {
    api.onBeforeBuild(async () => {
      const config = api.getNormalizedConfig();
      const publicDirs = normalizePublicDirs(config.server.publicDir);

      for (const publicDir of publicDirs) {
        const { name, copyOnBuild } = publicDir;

        if (!copyOnBuild || !name) {
          continue;
        }

        const normalizedPath = isAbsolute(name)
          ? name
          : join(api.context.rootPath, name);

        if (!fs.existsSync(normalizedPath)) {
          continue;
        }

        try {
          // async errors will missing error stack on copy, move
          // https://github.com/jprichardson/node-fs-extra/issues/769
          await fs.promises.cp(normalizedPath, api.context.distPath, {
            recursive: true,
            // dereference symlinks
            dereference: true,
          });
        } catch (err) {
          if (err instanceof Error) {
            err.message = `Copy public dir (${normalizedPath}) to dist failed:\n${err.message}`;
          }

          throw err;
        }
      }
    });
  },
});
