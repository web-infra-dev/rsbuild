import { expect, rspackTest } from '@e2e/helper';

rspackTest('should not load env by default', async ({ build }) => {
  await build({
    loadEnv: false,
  });
  expect(process.env.PUBLIC_FOO).toBe(undefined);
  expect(process.env.PUBLIC_BAR).toBe(undefined);
});

rspackTest(
  'should allow to call `build` with `loadEnv` options',
  async ({ build }) => {
    const result = await build({
      loadEnv: {
        mode: 'prod',
      },
    });

    expect(process.env.PUBLIC_FOO).toBe('foo');
    expect(process.env.PUBLIC_BAR).toBe('bar');

    await result.close();
    expect(process.env.PUBLIC_FOO).toBe(undefined);
    expect(process.env.PUBLIC_BAR).toBe(undefined);
  },
);
