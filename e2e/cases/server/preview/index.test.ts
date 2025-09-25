import { expect, getRandomPort, test } from '@e2e/helper';
import type { RsbuildPlugin } from '@rsbuild/core';

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
