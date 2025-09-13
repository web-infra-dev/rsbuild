import { expect, test } from '@e2e/helper';
import { type Logger, logger, type RsbuildPlugin } from '@rsbuild/core';

test('should allow plugin to custom resolver', async ({ build }) => {
  let pluginLogger: Logger | undefined;

  const loggerPlugin: RsbuildPlugin = {
    name: 'logger-plugin',
    setup(api) {
      pluginLogger = api.logger;
    },
  };

  await build({
    rsbuildConfig: {
      plugins: [loggerPlugin],
    },
  });

  expect(pluginLogger).toEqual(logger);
});
