import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should allow plugin to match data uri modules with `mimetype`',
  async ({ build }) => {
    const rsbuild = await build();
    const indexJs = await rsbuild.getIndexBundle();
    expect(indexJs).toContain('data-uri-bar');
  },
);
