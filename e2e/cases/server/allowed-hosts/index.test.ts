import { once } from 'node:events';
import { expect, test } from '@e2e/helper';

test('should allow arbitrary hosts by default', async ({ dev, request }) => {
  const rsbuild = await dev();
  const response = await request.get(`http://localhost:${rsbuild.port}`, {
    headers: { Host: 'app.example.test' },
  });
  expect(response.status()).toBe(200);
});

test('should validate hosts before user middleware', async ({
  dev,
  request,
}) => {
  const rsbuild = await dev({
    config: {
      server: {
        host: '0.0.0.0',
        allowedHosts: ['.example.test'],
        setup: ({ server }) => {
          server.middlewares.use((_req, res) => res.end('custom response'));
        },
      },
    },
  });

  const allowed = await request.get(`http://localhost:${rsbuild.port}`, {
    headers: { Host: 'app.example.test:3000' },
  });
  expect(await allowed.text()).toBe('custom response');
  const response = await request.get(`http://localhost:${rsbuild.port}`, {
    headers: { Host: 'attacker.test', 'X-Forwarded-Host': 'localhost' },
  });
  expect(response.status()).toBe(403);
  expect(await response.text()).toContain('server.allowedHosts');
});

test('should validate HMR and proxy upgrades after HTTP requests', async ({
  dev,
  request,
}) => {
  const target = await dev({ config: { dev: { client: { path: '/proxy' } } } });
  const rsbuild = await dev({
    config: {
      server: {
        allowedHosts: [],
        proxy: {
          '/proxy': { target: `http://localhost:${target.port}`, ws: true },
        },
      },
    },
  });
  const paths = [
    `/rsbuild-hmr?token=${rsbuild.server!.environments.web.context.webSocketToken}`,
    `/proxy?token=${target.server!.environments.web.context.webSocketToken}`,
  ];

  const response = await request.get(`http://localhost:${rsbuild.port}/proxy`);
  expect(response.status()).toBe(200);
  for (const path of paths) {
    const blocked = await request.get(
      `http://localhost:${rsbuild.port}${path}`,
      {
        headers: {
          Host: 'attacker.test',
          Connection: 'Upgrade',
          Upgrade: 'websocket',
        },
      },
    );
    expect(blocked.status()).toBe(403);

    const socket = new WebSocket(`ws://localhost:${rsbuild.port}${path}`);
    await once(socket, 'open');
    const closed = once(socket, 'close');
    socket.close();
    await closed;
  }
});
