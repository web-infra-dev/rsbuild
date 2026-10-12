import { once } from 'node:events';
import { createServer, type IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { expect, test as baseTest } from '@e2e/helper';
import { createRsbuild, type RsbuildDevServer } from '@rsbuild/core';
import { getRandomPort } from '@rstackjs/test-utils';
import { WebSocket, WebSocketServer } from 'ws';

const test = baseTest.extend<{
  upstream: { port: number; connections: number };
}>({
  upstream: async (_, use) => {
    const upstream = { port: await getRandomPort(), connections: 0 };
    const server = createServer((_req, res) => res.end('upstream'));
    const wss = new WebSocketServer({ server });
    wss.on('connection', (socket) => {
      upstream.connections++;
      socket.on('message', (data) => socket.send(data));
    });
    server.listen(upstream.port, '127.0.0.1');
    await once(server, 'listening');

    try {
      await use(upstream);
    } finally {
      for (const client of wss.clients) {
        client.terminate();
      }
      await new Promise<void>((resolve) => wss.close(() => resolve()));
      await server[Symbol.asyncDispose]();
    }
  },
});

async function expectEcho(url: string) {
  const socket = new WebSocket(url);
  try {
    await once(socket, 'open');
    const message = once(socket, 'message');
    socket.send('hello');
    const [data] = await message;
    expect(String(data)).toBe('hello');
  } finally {
    socket.terminate();
  }
}

for (const mode of ['dev', 'preview'] as const) {
  test(`should proxy WebSockets before and after HTTP requests in ${mode}`, async ({
    upstream,
    devOnly,
    build,
  }) => {
    const start = mode === 'dev' ? devOnly : build;
    const result = await start({
      runServer: true,
      config: {
        server: {
          proxy: {
            '/proxy': {
              target: `http://127.0.0.1:${upstream.port}`,
              ws: true,
            },
          },
        },
      },
    });
    const url = `localhost:${result.port}/proxy`;

    await expectEcho(`ws://${url}`);
    expect(await (await fetch(`http://${url}`)).text()).toBe('upstream');
    await expectEcho(`ws://${url}`);
    expect(upstream.connections).toBe(2);
  });
}

test('should detach proxy upgrades when replacing a middleware server', async ({
  upstream,
}) => {
  let devServer: RsbuildDevServer | undefined;
  const server = createServer((req, res) => {
    devServer?.middlewares(req, res);
  });
  const wss = new WebSocketServer({ noServer: true });
  const onUpgrade = (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    if (req.url === '/external') {
      wss.handleUpgrade(req, socket, head, (client) => {
        client.on('message', (data) => client.send(data));
      });
    }
  };
  server.on('upgrade', onUpgrade);
  const port = await getRandomPort();
  server.listen(port, '127.0.0.1');
  await once(server, 'listening');

  try {
    for (let generation = 0; generation < 2; generation++) {
      const rsbuild = await createRsbuild({
        cwd: import.meta.dirname,
        config: {
          server: {
            port,
            middlewareMode: true,
            proxy: {
              '/proxy': {
                target: `http://127.0.0.1:${upstream.port}`,
                ws: true,
              },
            },
          },
        },
      });
      devServer = await rsbuild.createDevServer({ runCompile: false });
      devServer.connectWebSocket({ server });
      devServer.connectWebSocket({ server });

      await expectEcho(`ws://127.0.0.1:${port}/proxy`);
      const response = await fetch(`http://127.0.0.1:${port}/proxy`);
      expect(await response.text()).toBe('upstream');
      await expectEcho(`ws://127.0.0.1:${port}/proxy`);
      expect(upstream.connections).toBe((generation + 1) * 2);

      await devServer.close();
      devServer = undefined;
      expect(server.listeners('upgrade')).toEqual([onUpgrade]);
      await expectEcho(`ws://127.0.0.1:${port}/external`);
    }
  } finally {
    await devServer?.close();
    for (const client of wss.clients) {
      client.terminate();
    }
    await new Promise<void>((resolve) => wss.close(() => resolve()));
    await server[Symbol.asyncDispose]();
  }
});
