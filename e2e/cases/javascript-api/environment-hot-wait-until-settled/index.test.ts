import { join } from 'node:path';
import { expect, HMR_CONNECTED_LOG, test } from '@e2e/helper';
import type { HmrSettlement } from '@rsbuild/core';

test('should wait until the matching HMR update is settled', async ({
  page,
  dev,
  editFile,
  copySrcDir,
}) => {
  const tempSrc = await copySrcDir();
  const entryPath = join(tempSrc, 'index.ts');
  const hmrConnected = page.waitForEvent('console', {
    predicate: (message) => message.text() === HMR_CONNECTED_LOG,
  });

  const { instance, server } = await dev({
    config: {
      source: {
        entry: {
          index: entryPath,
        },
      },
    },
  });
  await hmrConnected;

  if (!server) {
    throw new Error('Expected dev server');
  }

  let handled = false;
  const settlementPromise = new Promise<HmrSettlement>((resolve) => {
    instance.onAfterEnvironmentCompile(async ({ environment, stats }) => {
      const hash = stats?.compilation.hash;
      if (handled || environment.name !== 'web' || !hash) {
        return;
      }

      handled = true;
      resolve(await server.environments.web.hot.waitUntilSettled(hash));
    });
  });

  await expect(page.locator('#title')).toHaveText('before');

  await editFile(entryPath, (code) => code.replace('before', 'after'));
  await expect(settlementPromise).resolves.toEqual({
    hash: expect.any(String),
    status: 'applied',
  });
  await expect(page.locator('#title')).toHaveText('after');
});
