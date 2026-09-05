import { expect, test } from '@e2e/helper';
import { findFiles } from '@rstackjs/test-utils';

test('should respect custom JS output filename for worker query imports', async ({
  build,
}) => {
  const result = await build();

  const files = result.getDistFiles();
  const jsFiles = findFiles(files, '.js').sort();

  expect(jsFiles).toHaveLength(2);
  expect(jsFiles[0]).toMatch(/\/assets\/async\/.+\.bundle\.js$/);
  expect(jsFiles[1]).toMatch(/\/assets\/js\/index\.bundle\.js$/);
  expect(files[jsFiles[0]]).toContain('worker-filename-marker');
});
