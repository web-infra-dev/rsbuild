import { createRsbuild, getRandomPort } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import polka from 'polka';

test('multiple rsbuild dev servers should work correctly', async ({ page }) => {
  const rsbuild1 = await createRsbuild({
    cwd: import.meta.dirname,
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist',
        },
      },
      dev: {
        progressBar: false,
        assetPrefix: '/app',
      },
      server: {
        printUrls: false,
        middlewareMode: true,
      },
    },
  });

  const rsbuild2 = await createRsbuild({
    cwd: import.meta.dirname,
    rsbuildConfig: {
      source: {
        entry: {
          index: './src/index1',
        },
      },
      output: {
        distPath: {
          root: 'dist-1',
        },
      },
      server: {
        printUrls: false,
        middlewareMode: true,
      },
      dev: {
        progressBar: false,
        assetPrefix: '/app1',
      },
      environments: {
        web1: {},
      },
    },
  });

  const rsbuildServer1 = await rsbuild1.createDevServer();
  const rsbuildServer2 = await rsbuild2.createDevServer();

  const app = polka();

  app.use('/app', rsbuildServer1.middlewares);
  app.use('/app1', rsbuildServer2.middlewares);

  const port = await getRandomPort();

  const { server } = app.listen({ port });
  page.goto(`http://localhost:${port}/app`);
  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild!');

  page.goto(`http://localhost:${port}/app1`);
  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild1!');

  await rsbuildServer1.close();
  await rsbuildServer2.close();

  server?.close();
});
