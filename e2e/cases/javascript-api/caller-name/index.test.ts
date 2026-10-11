import { expect, test } from '@e2e/helper';
import type { RsbuildPluginAPI } from '@rsbuild/core';

test('should allow to set caller name and use it in plugins', async ({
  build,
}) => {
  let callerName = '';
  await build({
    callerName: 'foo',
    config: {
      plugins: [
        {
          name: 'foo',
          setup(api: RsbuildPluginAPI) {
            callerName = api.context.callerName;
          },
        },
      ],
    },
  });

  expect(callerName).toBe('foo');
});
