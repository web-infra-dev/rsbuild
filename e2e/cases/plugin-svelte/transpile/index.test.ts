import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should transpile .svelte files to ES2015 as expected',
  async ({ build }) => {
    expect(build()).resolves.toBeTruthy();
  },
);
