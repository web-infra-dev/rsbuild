import { expect, test } from '@e2e/helper';

test('should remove dead branches guarded by unused exported state', async ({ build }) => {
  const rsbuild = await build();
  const indexJs = await rsbuild.getIndexBundle();

  expect(indexJs).toContain('dce-expected-value');
  expect(indexJs).not.toContain('dce-removed-value');
});
