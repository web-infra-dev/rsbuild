import { once } from 'node:events';
import { expect, expectPoll, test } from '@e2e/helper';
import { createRsbuild } from '@rsbuild/core';

test('should replay to new connections and unsubscribe', async () => {
  let revision = 1;
  let unsubscribe = () => {};
  let connections = 0;
  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
    config: {
      server: {
        port: 0,
        setup({ action, server }) {
          if (action !== 'dev') return;
          unsubscribe = server.environments.web.hot.onConnect((client) => {
            connections++;
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

  const connect = async (environment = 'web') => {
    const { context } = server.environments[environment];
    const socket = new WebSocket(
      `ws://localhost:${server.port}${context.config.dev.client.path}?token=${context.webSocketToken}`,
    );
    const revisions: number[] = [];
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(String(data)) as {
        type: string;
        data: { data: number };
      };
      if (message.type === 'custom') {
        revisions.push(message.data.data);
      }
    });
    await once(socket, 'open');
    return { socket, revisions };
  };

  try {
    await server.listen();
    const first = await connect();
    await expectPoll(() => first.revisions).toEqual([1]);

    await connect('other');
    expect(connections).toBe(1);

    revision = 2;
    const second = await connect();
    await expectPoll(() => second.revisions).toEqual([2]);
    expect(first.revisions).toEqual([1]);

    const closed = once(second.socket, 'close');
    second.socket.close();
    await closed;
    revision = 4;
    const reconnected = await connect();
    await expectPoll(() => reconnected.revisions).toEqual([4]);
    expect(connections).toBe(3);

    unsubscribe();
    await connect();
    expect(connections).toBe(3);
  } finally {
    await server.close();
  }
});
