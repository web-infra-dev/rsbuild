import { expect } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';
import { rspackOnlyTest } from 'scripts';

rspackOnlyTest(
  'should allow to call `build` with `loadEnv` option',
  async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      loadEnv: {
        mode: 'prod',
      },
    });

    expect(process.env.PUBLIC_FOO).toBe('bar');
    const { close } = await rsbuild.build();
    await close();
    expect(process.env.PUBLIC_FOO).toBe(undefined);
  },
);
