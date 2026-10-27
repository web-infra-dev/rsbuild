import { expect, test } from '@e2e/helper';
import type { Rspack } from '@rsbuild/core';

test('should serve web assets early but wait for the full build before downstream middleware', async ({
  devOnly,
}) => {
  const releaseNode = Promise.withResolvers<void>();
  const requestQueued = Promise.withResolvers<void>();
  let nodeBuildDone = false;

  const pauseNodeBuild: Rspack.RspackPluginInstance = {
    apply(compiler) {
      compiler.hooks.afterEmit.tapPromise('pause-node-build', async () => {
        await releaseNode.promise;
        nodeBuildDone = true;
      });
    },
  };

  const rsbuild = await devOnly({
    waitFirstCompileDone: false,
    config: {
      server: {
        setup: ({ server }) => {
          server.middlewares.use('/node-ready', (_req, _res, next) => {
            next();
            // POST is queued synchronously, without an asynchronous asset lookup.
            requestQueued.resolve();
          });
          return () => {
            server.middlewares.use('/node-ready', (_req, res) => {
              res.statusCode = nodeBuildDone ? 200 : 503;
              res.end();
            });
          };
        },
      },
      environments: {
        web: {},
        node: {
          output: { target: 'node' },
          tools: {
            rspack: { plugins: [pauseNodeBuild] },
          },
        },
      },
    },
  });

  const url = `http://localhost:${rsbuild.port}`;
  try {
    // Web output must be available while the Node.js build is still paused.
    const asset = await fetch(`${url}/static/js/index.js`, {
      signal: AbortSignal.timeout(5_000),
    });
    expect(asset.status).toBe(200);
    expect(await asset.text()).toContain('hello world');
    expect(nodeBuildDone).toBe(false);

    const response = fetch(`${url}/node-ready`, {
      method: 'POST',
      signal: AbortSignal.timeout(5_000),
    });
    await requestQueued.promise;
    releaseNode.resolve();

    expect((await response).status).toBe(200);
  } finally {
    // Allow server cleanup to finish even when an assertion fails.
    releaseNode.resolve();
  }
});
