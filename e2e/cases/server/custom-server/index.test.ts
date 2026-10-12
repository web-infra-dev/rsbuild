import { createServer } from 'node:http';
import { expect, gotoPage, test } from '@e2e/helper';
import { createRsbuild } from '@rsbuild/core';

test('should remove WebSocket listeners from external servers on close', async () => {
  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
    config: {
      server: {
        port: 0,
        middlewareMode: true,
      },
    },
  });
  const rsbuildServer = await rsbuild.createDevServer();
  const servers = [createServer(), createServer()];
  const onUpgrade = () => {};

  try {
    for (const server of servers) {
      server.on('upgrade', onUpgrade);
      rsbuildServer.connectWebSocket({ server });
      rsbuildServer.connectWebSocket({ server });
      expect(server.listenerCount('upgrade')).toBe(2);
    }

    await rsbuildServer.environments.web.getStats();
    await rsbuildServer.close();

    for (const server of servers) {
      expect(server.listeners('upgrade')).toEqual([onUpgrade]);
      rsbuildServer.connectWebSocket({ server });
      expect(server.listeners('upgrade')).toEqual([onUpgrade]);
    }
  } finally {
    await rsbuildServer.close();
  }
});

test('should support a custom dev server', async ({ page }) => {
  const { startDevServer } = await import('./scripts/server.ts');
  const { config, close } = await startDevServer(import.meta.dirname);

  await gotoPage(page, config);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  const url1 = new URL(`http://localhost:${config.port}/bbb`);

  await page.goto(url1.href);
  await expect(page.locator('body')).toContainText('Hello hono!');

  await close();
});

test('should support a custom dev server without compilation', async ({
  page,
}) => {
  const { startDevServerPure } = await import('./scripts/pureServer.ts');
  const { config, close } = await startDevServerPure(import.meta.dirname);
  const indexRes = await gotoPage(page, config);

  expect(indexRes?.status()).toBe(404);

  const url1 = new URL(`http://localhost:${config.port}/bbb`);

  await page.goto(url1.href);
  await expect(page.locator('body')).toContainText('Hello hono!');

  const url2 = new URL(`http://localhost:${config.port}/test`);

  const res2 = await page.goto(url2.href);

  expect(await res2?.text()).toBe('Hello hono!');

  await close();
});
