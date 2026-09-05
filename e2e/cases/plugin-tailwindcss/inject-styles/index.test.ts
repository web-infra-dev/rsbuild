import { expect, test } from '@e2e/helper';
import { findFiles, getFileContent } from '@rstackjs/test-utils';

test('should inject transformed Tailwind CSS when injectStyles is enabled', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview();

  const files = rsbuild.getDistFiles();
  const cssFiles = findFiles(files, '.css');
  expect(cssFiles).toHaveLength(0);

  const indexJs = getFileContent(files, 'index.js');
  expect(indexJs).toMatch(/\.underline\{text-decoration-line:underline\}/);

  const title = page.locator('#title');
  await expect(title).toHaveCSS('font-weight', '700');
  await expect(title).toHaveCSS('text-decoration-line', 'underline');
});
