import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should allow to set caller name and use it in plugins',
  async ({ build }) => {
    let callerName = '';
    await build({
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

    expect(callerName).toBe('foo');
  },
);
