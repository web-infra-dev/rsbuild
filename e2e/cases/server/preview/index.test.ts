import { join } from 'node:path';
import { build, getRandomPort } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import type { RsbuildPlugin } from '@rsbuild/core';

test('should preview dist files correctly', async ({ page }) => {
  const cwd = join(__dirname, 'basic');
  const server = await build({
    cwd,
    page,
  });

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
    setup(api) {
      api.modifyRsbuildConfig((config) => {
        config.server ||= {};
        config.server.port = PORT;
        return config;
      });
    },
  };

  const server = await build({
    cwd,
    plugins: [plugin],
    page,
  });

  expect(server.port).toEqual(PORT);

  const rootEl = page.locator('#root');
  await expect(rootEl).toHaveText('Hello Rsbuild!');
  await server.close();
});
