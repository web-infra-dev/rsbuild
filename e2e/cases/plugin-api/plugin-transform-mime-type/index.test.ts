import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow plugin to match data uri modules with `mimetype`',
  async ({ build, buildOnly }) => {
    const rsbuild = await buildOnly();

    const indexJs = await rsbuild.getIndexBundle();
    expect(indexJs).toContain('data-uri-bar');
  },
);
