import { once } from 'node:events';
import { join } from 'node:path';
import { expect, test } from '@e2e/helper';

const cwd1 = join(import.meta.dirname, 'project1');
const cwd2 = join(import.meta.dirname, 'project2');

test('should apply basic proxy rules', async ({ dev, page }) => {
  const rsbuild1 = await dev({
    cwd: cwd1,
    config: {
      server: {
        host: '0.0.0.0',
      },
      dev: {
        assetPrefix: true,
      },
    },
  });

  const rsbuild2 = await dev({
    cwd: cwd2,
    config: {
      server: {
        proxy: {
          // https://stackoverflow.com/a/76727711/6219457
          '/': `http://127.0.0.1:${rsbuild1.port}/`,
        },
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild2.port}/`);
  expect(await page.innerHTML('body')).toContain('<div id="root">1</div>');
});

test('should leave dev HMR upgrades out of the WebSocket proxy', async ({
  dev,
}) => {
  const proxyPaths: string[] = [];
  const server = await dev({
    cwd: cwd2,
    config: {
      server: {
        proxy: [
          {
            pathFilter: (path) => {
              proxyPaths.push(path);
              return path.startsWith('/api');
            },
            target: 'http://127.0.0.1:1',
            ws: true,
          },
        ],
      },
    },
  });

  const token = server.server!.environments.web.context.webSocketToken;
  const socket = new WebSocket(
    `ws://localhost:${server.port}/rsbuild-hmr?token=${token}`,
  );
  try {
    await once(socket, 'open');
    expect(proxyPaths).not.toContain('/rsbuild-hmr');
  } finally {
    const closed = once(socket, 'close');
    socket.close();
    await closed;
  }
});
