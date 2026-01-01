import fs from 'node:fs';
import { isDeno } from '../constants';
import { color } from '../helpers';
import { dedupeNestedPaths } from '../helpers/path';
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

      for (const { name: publicDir, copyOnBuild } of config.server.publicDir) {
        if (copyOnBuild === false) {
          continue;
        }

        if (!fs.existsSync(publicDir)) {
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
            distPaths.map(async (distPath) => {
              // https://github.com/web-infra-dev/rsbuild/issues/5804
              if (isDeno && fs.existsSync(distPath)) {
                await fs.promises.rm(distPath, {
                  recursive: true,
                  force: true,
                });
              }

              await fs.promises.cp(publicDir, distPath, {
                recursive: true,
                // dereference symlinks
                dereference: true,
                mode: fs.constants.COPYFILE_FICLONE,
              });
            }),
          );
        } catch (err) {
          if (err instanceof Error) {
            err.message = `Failed to copy public directory '${color.yellow(publicDir)}' to output directory. To disable public directory copying, set \`${color.cyan('server.publicDir: false')}\` in your config.\n${err.message}`;
          }

          throw err;
        }
      }
    });
  },
});
