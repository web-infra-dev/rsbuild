import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should support import attributes syntax',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly();
    const indexJs = await rsbuild.getIndexBundle();
    expect(indexJs).toContain('with import attributes');
  },
);
