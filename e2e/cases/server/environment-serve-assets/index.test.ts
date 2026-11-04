import { setTimeout } from 'node:timers/promises';
import { expect, test } from '@e2e/helper';
import type { Rspack } from '@rsbuild/core';

test('should inherit serveAssets and allow environments to opt in', async ({
  runBothServe,
  request,
}) => {
  await runBothServe(async ({ result, mode }) => {
    const baseUrl = `http://localhost:${result.port}`;
    for (const path of ['/index.js', '/web-assets/index.js', '/server.js']) {
      const response = await request.get(`${baseUrl}${path}`);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('javascript');
    }
    for (const path of [
      '/worker.js',
      '/worker.js.map',
      '/worker-assets/worker.js',
    ]) {
      const response = await request.get(`${baseUrl}${path}`, {
        headers: { accept: 'application/json' },
      });
      expect(response.status()).toBe(404);
    }
    for (const [path, entry] of [
      ['/about', 'about'],
      ['/nested/route', 'index'],
    ]) {
      const response = await request.get(`${baseUrl}${path}`);
      expect(response.status()).toBe(200);
      expect(await response.text()).toContain(`/web-assets/${entry}.js`);
    }
    const files = result.getDistFiles({ sourceMaps: true });
    expect(
      Object.keys(files).some((file) => file.endsWith('/worker.js.map')),
    ).toBe(true);
    if (mode === 'dev') {
      const report = await request.get(`${baseUrl}/rsbuild-dev-server`);
      const html = await report.text();
      expect(html).toContain('Environment: web');
      expect(html).not.toContain('Environment: worker');
    }
  });
});

test('should disable output serving without disabling internal reads or custom routes', async ({
  runBothServe,
  request,
}) => {
  await runBothServe(
    async ({ result, mode }) => {
      const baseUrl = `http://localhost:${result.port}`;
      for (const path of [
        '/index.html',
        '/index',
        '/nested/route',
        '/worker.js',
        '/server.js',
      ]) {
        expect((await request.get(`${baseUrl}${path}`)).status()).toBe(404);
      }
      // Disabled HTML must not rewrite /about to /about.html before our route.
      for (const path of ['/index.js', '/about']) {
        const custom = await request.get(`${baseUrl}${path}`);
        expect(await custom.text()).toBe(`custom ${path}`);
      }
      const publicAsset = await request.get(`${baseUrl}/public.txt`);
      expect(publicAsset.status()).toBe(mode === 'dev' ? 200 : 404);

      if ('server' in result && result.server) {
        const bundle = await result.server.environments.node.loadBundle<{
          marker: string;
        }>('server');
        expect(bundle.marker).toBe('serve-assets');
        expect(
          await result.server.environments.web.getTransformedHtml('index'),
        ).toContain('<html>');
      }
    },
    {
      config: {
        server: {
          serveAssets: true,
          setup:
            ({ server }) =>
            () => {
              server.middlewares.use((req, res, next) => {
                if (req.url === '/index.js' || req.url === '/about') {
                  res.end(`custom ${req.url}`);
                } else {
                  next();
                }
              });
            },
        },
        environments: {
          worker: {
            server: { serveAssets: false },
          },
          web: {
            server: { serveAssets: false },
          },
          node: {
            server: { serveAssets: false },
          },
        },
      },
    },
  );
});

for (const target of [
  'node',
  'node20',
  'browserslist:last 2 node versions',
] as const) {
  test(`should wait for explicitly served ${target} output before resolving requests`, async ({
    devOnly,
    request,
  }) => {
    const result = await devOnly({
      waitFirstCompileDone: false,
      config: {
        environments: {
          node: {
            tools: {
              rspack: {
                target,
                dependencies: ['web', 'worker'],
                plugins: [
                  {
                    apply(compiler: Rspack.Compiler) {
                      compiler.hooks.beforeCompile.tapPromise('slow-node', () =>
                        setTimeout(100),
                      );
                    },
                  },
                ],
              },
            },
          },
        },
      },
    });
    const response = await request.get(
      `http://localhost:${result.port}/server.js`,
      {
        headers: { accept: 'application/json' },
      },
    );
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('serve-assets');
  });
}
