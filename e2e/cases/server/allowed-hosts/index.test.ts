import { once } from 'node:events';
import { expect, test } from '@e2e/helper';

test('should allow arbitrary hosts by default', async ({
  runBothServe,
  request,
}) => {
  await runBothServe(async ({ result }) => {
    const response = await request.get(`http://localhost:${result.port}`, {
      headers: { Host: 'app.example.test' },
    });
    expect(response.status()).toBe(200);
  });
});

test('should validate hosts before user middleware', async ({
  runBothServe,
  request,
}) => {
  await runBothServe(
    async ({ result }) => {
      const allowed = await request.get(`http://localhost:${result.port}`, {
        headers: { Host: 'app.example.test:3000' },
      });
      expect(await allowed.text()).toBe('custom response');
      const response = await request.get(`http://localhost:${result.port}`, {
        headers: { Host: 'attacker.test', 'X-Forwarded-Host': 'localhost' },
      });
      expect(response.status()).toBe(403);
      expect(await response.text()).toContain('server.allowedHosts');
    },
    {
      config: {
        server: {
          host: '0.0.0.0',
          allowedHosts: ['.example.test'],
          setup: ({ server }) => {
            server.middlewares.use((_req, res) => res.end('custom response'));
          },
        },
      },
    },
  );
});

test('should validate HMR and proxy upgrades after HTTP requests', async ({
  dev,
  runBothServe,
  request,
}) => {
  const target = await dev({ config: { dev: { client: { path: '/proxy' } } } });
  await runBothServe(
    async ({ mode, result }) => {
      const paths = [
        `/proxy?token=${target.server!.environments.web.context.webSocketToken}`,
      ];
      if (mode === 'dev') {
        paths.push(
          `/rsbuild-hmr?token=${result.server!.environments.web.context.webSocketToken}`,
        );
      }

      const response = await request.get(
        `http://localhost:${result.port}/proxy`,
      );
      expect(response.status()).toBe(200);
      for (const path of paths) {
        const blocked = await request.get(
          `http://localhost:${result.port}${path}`,
          {
            headers: {
              Host: 'attacker.test',
              Connection: 'Upgrade',
              Upgrade: 'websocket',
            },
          },
        );
        expect(blocked.status()).toBe(403);

        const socket = new WebSocket(`ws://localhost:${result.port}${path}`);
        await once(socket, 'open');
        const closed = once(socket, 'close');
        socket.close();
        await closed;
      }
    },
    {
      config: {
        server: {
          allowedHosts: [],
          proxy: {
            '/proxy': { target: `http://localhost:${target.port}`, ws: true },
          },
        },
      },
    },
  );
});
