import { rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';

rspackOnlyTest('should not load env by default', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    loadEnv: false,
    rsbuildConfig: {
      performance: {
        printFileSize: false,
      },
    },
  });

  expect(process.env.PUBLIC_FOO).toBe(undefined);
  expect(process.env.PUBLIC_BAR).toBe(undefined);
  const { close } = await rsbuild.build();
  await close();
});

rspackOnlyTest(
  'should allow to call `build` with `loadEnv` options',
  async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      loadEnv: {
        mode: 'prod',
      },
      rsbuildConfig: {
        performance: {
          printFileSize: false,
        },
      },
    });

    expect(process.env.PUBLIC_FOO).toBe('foo');
    expect(process.env.PUBLIC_BAR).toBe('bar');

    const { close } = await rsbuild.build();
    await close();

    expect(process.env.PUBLIC_FOO).toBe(undefined);
    expect(process.env.PUBLIC_BAR).toBe(undefined);
  },
);
