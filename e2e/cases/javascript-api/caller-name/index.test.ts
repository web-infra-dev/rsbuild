import { expect, rspackTest } from '@e2e/helper';
import { createRsbuild } from '@rsbuild/core';

rspackTest(
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
