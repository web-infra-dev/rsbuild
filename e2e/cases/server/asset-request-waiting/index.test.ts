import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { expect, test } from '@e2e/helper';
import type { Rspack } from '@rsbuild/core';

test('should serve web assets early but wait for the full build before downstream middleware', async ({
  copySrcDir,
  devOnly,
  editFile,
}) => {
  const tempSrc = await copySrcDir();
  const nodeStarted = Promise.withResolvers<void>();
  const releaseNode = Promise.withResolvers<void>();
  const requestsArrived = Promise.withResolvers<void>();
  const methods = ['GET', 'HEAD', 'POST'];
  let rebuilding = false;
  let nodeRebuildDone = false;
  let requestCount = 0;

  const pauseNodeRebuild: Rspack.RspackPluginInstance = {
    apply(compiler) {
      compiler.hooks.afterEmit.tapPromise('pause-node-rebuild', async () => {
        if (rebuilding) {
          nodeStarted.resolve();
          await releaseNode.promise;
          nodeRebuildDone = true;
        }
      });
    },
  };

  const rsbuild = await devOnly({
    config: {
      source: {
        entry: { index: join(tempSrc, 'index.js') },
      },
      server: {
        setup: ({ server }) => {
          server.middlewares.use('/node-ready', (_req, _res, next) => {
            next();
            if (++requestCount === methods.length) {
              requestsArrived.resolve();
            }
          });
          return () => {
            server.middlewares.use('/node-ready', (_req, res) => {
              res.statusCode = nodeRebuildDone ? 200 : 503;
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
            rspack: { plugins: [pauseNodeRebuild] },
          },
        },
      },
    },
  });

  const url = `http://localhost:${rsbuild.port}`;
  rebuilding = true;
  try {
    await editFile(join(tempSrc, 'index.js'), (code) =>
      code.replace('hello world', 'changed'),
    );
    await nodeStarted.promise;

    // Web output must be available while the Node.js build is still paused.
    await expect
      .poll(async () => {
        const response = await fetch(`${url}/static/js/index.js`, {
          signal: AbortSignal.timeout(2_000),
        });
        expect(response.status).toBe(200);
        return response.text();
      })
      .toContain('changed');
    expect(nodeRebuildDone).toBe(false);

    const responses = Promise.all(
      methods.map((method) =>
        fetch(`${url}/node-ready`, {
          method,
          signal: AbortSignal.timeout(5_000),
        }),
      ),
    );
    await requestsArrived.promise;

    // Observe pending requests briefly; compilation itself has no timed delay.
    expect(await Promise.race([responses, setTimeout(100, 'pending')])).toBe(
      'pending',
    );
    releaseNode.resolve();

    for (const response of await responses) {
      expect(response.status).toBe(200);
    }
  } finally {
    // Allow server cleanup to finish even when an assertion fails.
    releaseNode.resolve();
  }
});
