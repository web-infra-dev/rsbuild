import fs from 'node:fs';
import { open } from '../server/open';
import {
  copyPublicDir,
  getPublicDirCopies,
  watchPublicDirs,
} from '../server/publicDir';
import type { OnAfterStartDevServerFn, RsbuildPlugin } from '../types';

// For Rsbuild server config
export const pluginServer = (): RsbuildPlugin => ({
  name: 'rsbuild:server',

  setup(api) {
    const onStartServer: OnAfterStartDevServerFn = async ({ port, routes }) => {
      const config = api.getNormalizedConfig();
      if (config.server.open) {
        const protocol = config.server.https ? 'https' : 'http';
        await open({
          port,
          routes,
          config,
          protocol,
          logger: api.logger,
        });
      }
    };

    api.onAfterStartDevServer(onStartServer);
    api.onAfterStartPreviewServer(onStartServer);

    // A caller can close a watch build before its first onBeforeBuild hook runs.
    let buildClosed = false;
    api.onAfterCreateCompiler(() => {
      buildClosed = false;
    });
    let watch: ReturnType<typeof watchPublicDirs> | undefined;
    api.onBeforeBuild(async ({ isFirstCompile, isWatch, environments }) => {
      if (!isFirstCompile) {
        await watch?.pause();
        return;
      }

      const copies = getPublicDirCopies(environments, isWatch);
      if (isWatch && !buildClosed && copies.length) {
        watch = watchPublicDirs(copies, api.logger);
        await watch.ready;
      }
      for (const copy of copies) {
        if (!isWatch || fs.existsSync(copy.publicDir)) {
          await copyPublicDir(copy, watch?.copied);
        }
      }
    });
    api.onAfterBuild(async ({ stats }) => {
      if (stats) {
        await watch?.resume(stats);
      }
    });
    api.onCloseBuild(async () => {
      buildClosed = true;
      const current = watch;
      watch = undefined;
      await current?.close();
    });
  },
});
