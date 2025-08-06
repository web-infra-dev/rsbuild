import fs from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { normalizePublicDirs } from '../defaultConfig';
import { dedupeNestedPaths } from '../helpers';
import { open } from '../server/open';
import type { OnAfterStartDevServerFn, RsbuildPlugin } from '../types';

// For Rsbuild server config
export const pluginServer = (): RsbuildPlugin => ({
  name: 'rsbuild:server',

  setup(api) {
    const onStartServer: OnAfterStartDevServerFn = ({ port, routes }) => {
      const config = api.getNormalizedConfig();
      if (config.server.open) {
        open({
          https: api.context.devServer?.https,
          port,
          routes,
          config,
        });
      }
    };

    api.onAfterStartDevServer(onStartServer);
    api.onAfterStartProdServer(onStartServer);
    api.onBeforeBuild(async ({ isFirstCompile, environments }) => {
      if (!isFirstCompile) {
        return;
      }
      const config = api.getNormalizedConfig();
      const publicDirs = normalizePublicDirs(config.server.publicDir);

      for (const publicDir of publicDirs) {
        const { name, copyOnBuild } = publicDir;

        if (copyOnBuild === false || !name) {
          continue;
        }

        const normalizedPath = isAbsolute(name)
          ? name
          : join(api.context.rootPath, name);

        if (!fs.existsSync(normalizedPath)) {
          continue;
        }

        const distPaths = dedupeNestedPaths(
          Object.values(environments)
            .filter(
              ({ config }) =>
                copyOnBuild === true ||
                (copyOnBuild === 'auto' && config.output.target !== 'node'),
            )
            .map(({ distPath }) => distPath),
        );

        try {
          // async errors will missing error stack on copy, move
          // https://github.com/jprichardson/node-fs-extra/issues/769
          await Promise.all(
            distPaths.map((distPath) =>
              fs.promises.cp(normalizedPath, distPath, {
                recursive: true,
                // dereference symlinks
                dereference: true,
              }),
            ),
          );
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
