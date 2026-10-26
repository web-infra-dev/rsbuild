import { join } from 'node:path';
import { expect, gotoPage, test } from '@e2e/helper';
import type { Rspack } from '@rsbuild/core';

const NODE_REBUILD_DELAY = 10_000;

test('should update web assets early but wait for node builds in downstream middleware', async ({
  page,
  devOnly,
  editFile,
  copySrcDir,
}) => {
  const tempSrc = await copySrcDir();
  let nodeBuilds = 0;
  let nodeRebuildDone = false;

  const slowNodeRebuildPlugin: Rspack.RspackPluginInstance = {
    apply(compiler) {
      compiler.hooks.afterEmit.tapPromise('slow-node-rebuild', async () => {
        nodeBuilds++;
        if (nodeBuilds > 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, NODE_REBUILD_DELAY),
          );
          nodeRebuildDone = true;
        }
      });
    },
  };

  const rsbuild = await devOnly({
    config: {
      server: {
        setup: ({ server }) => {
          return () => {
            server.middlewares.use('/node-ready', (_req, res) => {
              res.statusCode = nodeRebuildDone ? 200 : 503;
              res.end();
            });
          };
        },
      },
      environments: {
        web: {
          source: {
            entry: {
              index: join(tempSrc, 'index.js'),
            },
          },
        },
        node: {
          source: {
            entry: {
              server: join(tempSrc, 'server.js'),
            },
          },
          output: {
            target: 'node',
          },
          tools: {
            rspack: {
              plugins: [slowNodeRebuildPlugin],
            },
          },
        },
      },
    },
  });

  await gotoPage(page, rsbuild);
  await expect(page.locator('#message')).toHaveText('hello world');

  await editFile(join(tempSrc, 'shared.js'), (code) =>
    code.replace('hello world', 'changed'),
  );

  await expect(page.locator('#message')).toHaveText('changed', {
    timeout: NODE_REBUILD_DELAY / 2,
  });
  expect(nodeRebuildDone).toBe(false);

  // Requests passed to downstream middleware still need the complete build.
  const responses = await Promise.all(
    ['GET', 'HEAD', 'POST'].map((method) =>
      fetch(`http://localhost:${rsbuild.port}/node-ready`, { method }),
    ),
  );
  for (const response of responses) {
    expect(response.status).toBe(200);
  }
});
