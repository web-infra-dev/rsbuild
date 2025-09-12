import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow plugin to transform code with import attributes',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly();
    const indexJs = await rsbuild.getIndexBundle();
    expect(indexJs).toContain('with import attributes');
  },
);
