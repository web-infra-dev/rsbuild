import { expect, getRandomPort, test } from '@e2e/helper';
import { createRsbuild } from '@rsbuild/core';
import polka from 'polka';

// TODO: flaky test
test.skip('multiple rsbuild dev servers should work correctly', async ({
  page,
}) => {
  const rsbuild1 = await createRsbuild({
    cwd: __dirname,
    config: {
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
      dev: {
        assetPrefix: '/app1',
      },
      server: {
        middlewareMode: true,
      },
    },
  });

  const rsbuild2 = await createRsbuild({
    cwd: __dirname,
    config: {
      source: {
        entry: {
          index: './src/index2',
        },
      },
      output: {
        distPath: {
          root: 'dist-2',
        },
      },
      server: {
        middlewareMode: true,
      },
      dev: {
        assetPrefix: '/app2',
      },
      environments: {
        web1: {},
      },
    },
  });

  const rsbuildServer1 = await rsbuild1.createDevServer();
  const rsbuildServer2 = await rsbuild2.createDevServer();

  const app = polka();

  app.use('/app1', rsbuildServer1.middlewares);
  app.use('/app2', rsbuildServer2.middlewares);

  const port = await getRandomPort();

  const { server } = app.listen({ port });
  page.goto(`http://localhost:${port}/app1`);
  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild1!');

  page.goto(`http://localhost:${port}/app2`);
  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild2!');

  await rsbuildServer1.close();
  await rsbuildServer2.close();

  server?.close();
});
