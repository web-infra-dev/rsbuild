import { once } from 'node:events';
import { createServer } from 'node:http';
import { expect, expectPoll, test } from '@e2e/helper';
import { createRsbuild, type HotClient } from '@rsbuild/core';

test.each([false, true])(
  'should replay to new connections and unsubscribe (middlewareMode: %s)',
  async (middlewareMode) => {
    let revision = 1;
    let unsubscribe = () => {};
    const clients: HotClient[] = [];
    const rsbuild = await createRsbuild({
      cwd: import.meta.dirname,
      config: {
        server: {
          port: 0,
          middlewareMode,
          setup({ action, server }) {
            if (action !== 'dev') return;
            unsubscribe = server.environments.web.hot.onConnect((client) => {
              clients.push(client);
              client.send('custom', { event: 'revision', data: revision });
            });
          },
        },
        environments: {
          web: {},
          other: { output: { distPath: { root: 'dist/other' } } },
        },
      },
    });
    const server = await rsbuild.createDevServer();
    const customServer = middlewareMode
      ? createServer(server.middlewares)
      : undefined;
    const sockets: WebSocket[] = [];

    const connect = (environment = 'web', token?: string) => {
      const { context } = server.environments[environment];
      const socket = new WebSocket(
        `ws://localhost:${server.port}${context.config.dev.client.path}?token=${token ?? context.webSocketToken}`,
      );
      sockets.push(socket);
      const types: string[] = [];
      const revisions: number[] = [];
      socket.addEventListener('message', ({ data }) => {
        const message = JSON.parse(String(data)) as {
          type: string;
          data: { event: string; data: number };
        };
        types.push(message.type);
        if (message.type === 'custom' && message.data.event === 'revision') {
          revisions.push(message.data.data);
        }
      });
      return { socket, types, revisions };
    };

    try {
      if (customServer) {
        server.connectWebSocket({ server: customServer });
        customServer.listen(server.port);
        await once(customServer, 'listening');
        await server.afterListen();
      } else {
        await server.listen();
      }
      await server.environments.web.getStats();

      const first = connect();
      await expectPoll(() => first.revisions).toEqual([1]);
      expect(first.types.slice(0, 3)).toEqual(['hash', 'ok', 'custom']);

      const other = connect('other');
      await expectPoll(() => other.types).toContain('ok');
      expect(other.revisions).toEqual([]);
      expect(clients).toHaveLength(1);

      revision = 2;
      const second = connect();
      await expectPoll(() => second.revisions).toEqual([2]);
      expect(first.revisions).toEqual([1]);

      const closed = once(second.socket, 'close');
      second.socket.close();
      await closed;
      revision = 4;
      const reconnected = connect();
      await expectPoll(() => reconnected.revisions).toEqual([4]);
      expect(clients).toHaveLength(3);

      const rejected = connect('web', 'invalid-token');
      await once(rejected.socket, 'error');
      expect(clients).toHaveLength(3);

      unsubscribe();
      unsubscribe();
      const unsubscribed = connect();
      await expectPoll(() => unsubscribed.types).toContain('ok');
      expect(unsubscribed.revisions).toEqual([]);
      expect(clients).toHaveLength(3);

      await server.close();
      expect(() =>
        clients[0].send('custom', { event: 'closed' }),
      ).not.toThrow();
    } finally {
      for (const socket of sockets) socket.close();
      await server.close();
      if (customServer) {
        await new Promise<void>((resolve) =>
          customServer.close(() => resolve()),
        );
      }
    }
  },
);
