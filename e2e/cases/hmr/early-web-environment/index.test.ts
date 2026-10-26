import { join } from 'node:path';
import { expect, gotoPage, test } from '@e2e/helper';
import type { Rspack } from '@rsbuild/core';

const NODE_REBUILD_DELAY = 10_000;

test('should apply HMR updates without waiting for slower node environments', async ({
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
});
