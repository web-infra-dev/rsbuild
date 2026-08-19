import { expect, test } from '@e2e/helper';
import { getRandomPort } from '@rstackjs/test-utils';
import type { RsbuildPlugin } from '@rsbuild/core';

test('should set the port via server.port', async ({ page, dev }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const port = await getRandomPort();
  const rsbuild = await dev({
    config: {
      server: {
        port,
      },
    },
  });

  expect(rsbuild.port).toBe(port);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  expect(errors).toEqual([]);
});

test('should resolve server.port 0 to the actual port', async ({
  page,
  dev,
}) => {
  let hookPort: number | undefined;
  const plugin: RsbuildPlugin = {
    name: 'test-port',
    setup(api) {
      api.onAfterStartDevServer(({ port }) => {
        hookPort = port;
      });
    },
  };

  const rsbuild = await dev({
    config: {
      server: {
        port: 0,
        strictPort: true,
      },
      dev: {
        assetPrefix: true,
      },
      plugins: [plugin],
    },
  });

  expect(rsbuild.port).toBeGreaterThan(0);
  expect(rsbuild.server?.port).toBe(rsbuild.port);
  expect(rsbuild.instance.context.devServer?.port).toBe(rsbuild.port);
  expect(hookPort).toBe(rsbuild.port);
  expect(rsbuild.urls).toContain(`http://localhost:${rsbuild.port}`);

  const address = rsbuild.server?.httpServer?.address();
  expect(
    address && typeof address !== 'string' ? address.port : undefined,
  ).toBe(rsbuild.port);

  const scriptSrc = await page
    .locator('script[src]')
    .first()
    .getAttribute('src');
  expect(scriptSrc).toContain(`http://localhost:${rsbuild.port}/`);
  await expect(page.locator('#test')).toHaveText('Hello Rsbuild!');
});
