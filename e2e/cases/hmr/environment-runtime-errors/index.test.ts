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
  let firstBuild = true;

  const nodePlugin: Rspack.RspackPluginInstance = {
    apply(compiler) {
      compiler.hooks.afterCompile.tapPromise(
        'node-errors',
        async (compilation) => {
          if (firstBuild) {
            firstBuild = false;
            compilation.errors.push(new Error('Node compilation error'));
          } else {
            await releaseNode.promise;
          }
        },
      );
    },
  };

  await dev({
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

    // Node recovers after the runtime error arrives, without another web update.
    releaseNode.resolve();
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
