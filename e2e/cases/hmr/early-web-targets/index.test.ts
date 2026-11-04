import { once } from 'node:events';
import { expect, test } from '@e2e/helper';
import type { Rspack } from '@rsbuild/core';

for (const target of ['node20', 'browserslist:last 2 node versions'] as const) {
  test(`should release web assets and updates before ${target} finishes`, async ({
    devOnly,
    request,
  }) => {
    const releaseWeb = Promise.withResolvers<void>();
    const releaseNode = Promise.withResolvers<void>();
    const { server, port } = await devOnly({
      waitFirstCompileDone: false,
      config: {
        environments: {
          web: {},
          node: {
            source: {
              entry: { server: './src/server.js' },
            },
            output: { target: 'node' },
            tools: {
              rspack: { target },
            },
          },
        },
        tools: {
          rspack(config, { environment }) {
            config.plugins.push({
              apply(compiler: Rspack.Compiler) {
                compiler.hooks.afterCompile.tapPromise('pause-build', () =>
                  environment.name === 'web'
                    ? releaseWeb.promise
                    : releaseNode.promise,
                );
              },
            });
          },
        },
      },
    });
    const { context } = server!.environments.web;
    const socket = new WebSocket(
      `ws://localhost:${port}${context.config.dev.client.path}?token=${context.webSocketToken}`,
    );
    const messages: string[] = [];
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(String(data)) as { type: string };
      messages.push(message.type);
    });
    try {
      await once(socket, 'open');
      releaseWeb.resolve();
      // Node stays paused until both the notification and asset are available.
      await expect.poll(() => messages).toContain('early-update');
      const response = await request.get(
        `http://localhost:${port}/static/js/index.js`,
        { timeout: 5_000 },
      );
      expect(response.status()).toBe(200);
      expect(await response.text()).toContain('web asset');
    } finally {
      releaseWeb.resolve();
      releaseNode.resolve();
      socket.close();
    }
  });
}
