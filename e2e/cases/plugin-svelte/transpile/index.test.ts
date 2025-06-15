import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should transpile .svelte files to ES2015 as expected',
  async () => {
    expect(
      build({
        cwd: __dirname,
      }),
    ).resolves.toBeTruthy();
  },
);
