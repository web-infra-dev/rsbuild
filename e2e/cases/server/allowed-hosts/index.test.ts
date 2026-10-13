import { get } from 'node:http';
import { expect, test } from '@e2e/helper';

const upgrade = (port: number, path: string, host: string) =>
  new Promise<number | undefined>((resolve, reject) => {
    get({
      hostname: 'localhost',
      port,
      path,
      headers: {
        Host: host,
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
      },
    })
      .on('upgrade', (res, socket) => {
        socket.destroy();
        resolve(res.statusCode);
      })
      .on('response', (res) => {
        res.resume();
        resolve(res.statusCode);
      })
      .on('error', reject);
  });

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

  for (const host of ['localhost', '127.0.0.1', 'app.example.test:3000']) {
    const response = await request.get(`http://localhost:${rsbuild.port}`, {
      headers: { Host: host },
    });
    expect(await response.text()).toBe('custom response');
  }
  const response = await request.get(`http://localhost:${rsbuild.port}`, {
    headers: { Host: 'attacker.test', 'X-Forwarded-Host': 'localhost' },
  });
  expect(response.status()).toBe(403);
  expect(await response.text()).toContain('server.allowedHosts');
});

test('should validate HMR and proxy upgrades before and after HTTP requests', async ({
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

  for (const path of paths) {
    expect(await upgrade(rsbuild.port, path, 'attacker.test')).toBe(403);
    expect(await upgrade(rsbuild.port, path, 'localhost')).toBe(101);
  }

  const response = await request.get(`http://localhost:${rsbuild.port}/proxy`);
  expect(response.status()).toBe(200);
  for (const path of paths) {
    expect(await upgrade(rsbuild.port, path, 'attacker.test')).toBe(403);
  }
});
