import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { type Logger, logger, type RsbuildPlugin } from '@rsbuild/core';

test('should allow plugin to custom resolver', async () => {
  let pluginLogger: Logger | undefined;

  const loggerPlugin: RsbuildPlugin = {
    name: 'logger-plugin',
    setup(api) {
      pluginLogger = api.logger;
    },
  };

  await build({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [loggerPlugin],
    },
  });

  expect(pluginLogger).toEqual(logger);
});
