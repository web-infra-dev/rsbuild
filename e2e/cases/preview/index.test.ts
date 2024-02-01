import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { build, getRandomPort, gotoPage } from '@e2e/helper';
import type { RsbuildPlugin } from '@rsbuild/core';

test('should preview dist files correctly', async ({ page }) => {
  const cwd = join(__dirname, 'basic');

  const { instance } = await build({
    cwd,
  });

  const { port, server } = await instance.preview();

  await gotoPage(page, { port });

  const rootEl = page.locator('#root');
  await expect(rootEl).toHaveText('Hello Rsbuild!');

  await server.close();
});

test('should allow plugin to modify preview server config', async ({
  page,
}) => {
  const cwd = join(__dirname, 'basic');
  const PORT = await getRandomPort();

  const plugin: RsbuildPlugin = {
    name: 'test',
    setup: (api) => {
      api.modifyRsbuildConfig((config) => {
        config.server ||= {};
        config.server.port = PORT;
        return config;
      });
    },
  };

  const { instance } = await build({
    cwd,
    plugins: [plugin],
  });

  const { port, server } = await instance.preview();

  expect(port).toEqual(PORT);

  await gotoPage(page, { port });
  const rootEl = page.locator('#root');
  await expect(rootEl).toHaveText('Hello Rsbuild!');
  await server.close();
});
