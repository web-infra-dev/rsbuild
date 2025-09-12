import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should transpile .svelte files to ES2015 as expected',
  async ({ buildOnly }) => {
    expect(buildOnly()).resolves.toBeTruthy();
  },
);
