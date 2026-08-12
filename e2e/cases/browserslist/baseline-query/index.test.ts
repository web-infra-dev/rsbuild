import { expect, test } from '@e2e/helper';
import { getFileContent } from '@rstackjs/test-utils';

test('should transform syntax with a Baseline query', async ({ build }) => {
  const rsbuild = await build();
  const indexFile = getFileContent(rsbuild.getDistFiles(), 'index.js');

  expect(indexFile).not.toContain('?.');
  expect(indexFile).toContain('value === null || value === void 0 ? void 0 : value.message');
});
