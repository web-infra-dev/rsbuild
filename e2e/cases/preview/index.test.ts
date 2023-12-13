import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, getRandomPort, getHrefByEntryName } from '@scripts/shared';
import { RsbuildPlugin } from '@rsbuild/core';

test('should preview dist files correctly', async ({ page }) => {
  const cwd = join(__dirname, 'basic');

  const { instance } = await build({
    cwd,
  });

  const { port, server } = await instance.preview();

  await page.goto(getHrefByEntryName('index', port));

  const rootEl = page.locator('#root');
  await expect(rootEl).toHaveText('Hello Rsbuild!');

  await server.close();
});

test('should allow plugin to modify preview server config', async ({
  page,
}) => {
  const cwd = join(__dirname, 'basic');
  const PORT = getRandomPort();

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

  await page.goto(getHrefByEntryName('index', port));
  const rootEl = page.locator('#root');
  await expect(rootEl).toHaveText('Hello Rsbuild!');
  await server.close();
});
