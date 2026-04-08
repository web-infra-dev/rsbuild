import { expect, test } from '@e2e/helper';
import { copyPkgToNodeModules } from './helper';

test('should support transformImport for CommonJS packages', async ({
  build,
}) => {
  copyPkgToNodeModules();

  const rsbuild = await build();
  const content = await rsbuild.getIndexBundle();

  expect(content).toContain('transformImport test succeed');
  expect(content).not.toContain('unused debounce should not be bundled');
});
