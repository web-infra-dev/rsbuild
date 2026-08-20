import { basename } from 'node:path';
import { expect, test } from '@e2e/helper';
import { findFile, getRandomPort } from '@rstackjs/test-utils';
import type { RsbuildPlugin, RsbuildPreviewServer } from '@rsbuild/core';

test('should preview dist files correctly', async ({ page, buildPreview }) => {
  await buildPreview();
  const rootEl = page.locator('#root');
  await expect(rootEl).toHaveText('Hello Rsbuild!');
});

test('should allow plugin to modify preview server config', async ({
  page,
  buildPreview,
}) => {
  const PORT = await getRandomPort();
  const plugin: RsbuildPlugin = {
    name: 'test',
    setup(api) {
      api.modifyRsbuildConfig((config) => {
        config.server ||= {};
        config.server.port = PORT;
        return config;
      });
    },
  };

  const result = await buildPreview({
    config: {
      plugins: [plugin],
    },
  });

  expect(result.port).toEqual(PORT);

  const rootEl = page.locator('#root');
  await expect(rootEl).toHaveText('Hello Rsbuild!');
});

test('should resolve server.port 0 for preview server', async ({
  page,
  buildPreview,
}) => {
  let hookPort: number | undefined;
  let previewServer: RsbuildPreviewServer | undefined;
  const plugin: RsbuildPlugin = {
    name: 'test-port',
    setup(api) {
      api.onBeforeStartPreviewServer(({ server }) => {
        previewServer = server;
      });
      api.onAfterStartPreviewServer(({ port }) => {
        hookPort = port;
      });
    },
  };

  const result = await buildPreview({
    config: {
      server: {
        port: 0,
        strictPort: true,
      },
      plugins: [plugin],
    },
  });

  expect(result.port).toBeGreaterThan(0);
  expect(previewServer?.port).toBe(result.port);
  expect(hookPort).toBe(result.port);

  const address = previewServer?.httpServer?.address();
  expect(
    address && typeof address !== 'string' ? address.port : undefined,
  ).toBe(result.port);

  await expect(page.locator('#root')).toHaveText('Hello Rsbuild!');
});

test('should serve multi-environment assets before returned setup middleware', async ({
  buildPreview,
}) => {
  const result = await buildPreview({
    config: {
      server: {
        htmlFallback: false,
        setup: ({ server }) => {
          return () => {
            server.middlewares.use((_req, res) => {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end('<html>SSR fallback</html>');
            });
          };
        },
      },
      environments: {
        web: {
          output: {
            assetPrefix: '/app',
            distPath: 'dist/client',
          },
        },
        node: {
          output: {
            target: 'node',
            distPath: 'dist/server',
          },
        },
      },
    },
  });

  const assetFile = findFile(
    result.getDistFiles(),
    /\/dist\/client\/static\/js\/.+\.js$/,
  );

  const res = await fetch(
    `http://localhost:${result.port}/app/static/js/${basename(assetFile)}`,
  );

  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toContain('javascript');
  expect(await res.text()).toContain('Hello Rsbuild!');

  const siblingPrefixRes = await fetch(
    `http://localhost:${result.port}/app2/static/js/${basename(assetFile)}`,
  );
  expect(siblingPrefixRes.status).toBe(404);
  expect(await siblingPrefixRes.text()).toBe('<html>SSR fallback</html>');

  const serverBundleRes = await fetch(
    `http://localhost:${result.port}/index.js`,
  );
  expect(serverBundleRes.status).toBe(404);
  expect(await serverBundleRes.text()).toBe('<html>SSR fallback</html>');

  const nestedServerBundleRes = await fetch(
    `http://localhost:${result.port}/server/index.js`,
  );
  expect(nestedServerBundleRes.status).toBe(404);
  expect(await nestedServerBundleRes.text()).toBe('<html>SSR fallback</html>');
});
