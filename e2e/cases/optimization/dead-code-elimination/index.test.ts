import { expect, test } from '@e2e/helper';

test('should remove dead branches guarded by unused exported bindings', async ({ build }) => {
  const rsbuild = await build();
  const indexJs = await rsbuild.getIndexBundle();

  // Keep the assertions marker-based so they do not depend on minified syntax.
  expect(indexJs).toContain('dce-unused-mutator-expected');
  expect(indexJs).not.toContain('dce-unused-mutator-removed');
  expect(indexJs).toContain('dce-exported-state-expected');
  expect(indexJs).not.toContain('dce-exported-state-removed');
});
