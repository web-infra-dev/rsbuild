import { join } from 'node:path';
import { expect, OVERLAY_ID, test } from '@e2e/helper';
import type { Rspack } from '@rsbuild/core';

test('should show runtime errors from early updates after Node recovers', async ({
  page,
  dev,
  editFile,
  copySrcDir,
}) => {
  const tempSrc = await copySrcDir();
  const hmrSocket = page.waitForEvent('websocket');
  const releaseNode = Promise.withResolvers<void>();
  let pauseNode = false;
  let failNode = true;

  const nodePlugin: Rspack.RspackPluginInstance = {
    apply(compiler) {
      compiler.hooks.make.tapPromise('node-errors', async () => {
        if (pauseNode) {
          await releaseNode.promise;
        }
      });
      compiler.hooks.afterCompile.tap('node-errors', (compilation) => {
        if (failNode) {
          compilation.errors.push(new Error('Node compilation error'));
        }
      });
    },
  };

  const rsbuild = await dev({
    config: {
      dev: { client: { overlay: { runtime: true } } },
      environments: {
        web: {
          source: { entry: { index: join(tempSrc, 'index.js') } },
        },
        node: {
          source: { entry: { server: join(tempSrc, 'server.js') } },
          output: { target: 'node' },
          tools: { rspack: { plugins: [nodePlugin] } },
        },
      },
    },
  });

  const overlay = page.locator(OVERLAY_ID);
  await expect(overlay).toContainText('Node compilation error');

  try {
    pauseNode = true;
    await editFile(join(tempSrc, 'shared.js'), (code) =>
      code.replace('hello world', 'changed'),
    );

    // HMR must work while Node is paused, without dismissing its known error.
    await expect(page.locator('#root')).toHaveText('changed');
    await expect(overlay).toContainText('Node compilation error');

    const resolvedError = (await hmrSocket).waitForEvent('framereceived', {
      predicate: ({ payload }) => {
        const message = JSON.parse(String(payload)) as { type: string };
        return message.type === 'resolved-client-error';
      },
    });
    // Trigger an application error without dismissing the build error overlay.
    await page.evaluate(() => document.getElementById('root')!.click());
    await resolvedError;
    await expect(overlay).toContainText('Node compilation error');

    const failedBuild = Promise.withResolvers<void>();
    rsbuild.instance.onAfterDevCompile(() => failedBuild.resolve());
    releaseNode.resolve();
    await failedBuild.promise;
    await expect(overlay).toContainText('Node compilation error');

    // Only Node changes: recovery must clear build errors even with the same web hash.
    failNode = false;
    await editFile(join(tempSrc, 'server.js'), (code) => `${code}\n`);
    await expect(overlay).toContainText('Runtime error after early update');
    // A newer web update must still clear errors from the previous code.
    await editFile(join(tempSrc, 'shared.js'), (code) =>
      code.replace('changed', 'recovered'),
    );
    await expect(page.locator('#root')).toHaveText('recovered');
    await expect(overlay).toHaveCount(0);
  } finally {
    releaseNode.resolve();
  }
});
