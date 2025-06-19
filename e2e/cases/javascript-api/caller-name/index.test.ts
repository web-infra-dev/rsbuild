import { rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';

rspackOnlyTest(
  'should allow to set caller name and use it in plugins',
  async () => {
    let callerName = '';
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      callerName: 'foo',
      rsbuildConfig: {
        plugins: [
          {
            name: 'foo',
            setup(api) {
              callerName = api.context.callerName;
            },
          },
        ],
      },
    });

    await rsbuild.build();
    expect(callerName).toBe('foo');
  },
);
