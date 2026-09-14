import { expect, test } from '@e2e/helper';
import { findFiles, getFileContent } from '@rstackjs/test-utils';

test('should build CSS entry', async ({ buildPreview, page }) => {
  const rsbuild = await buildPreview();

  const files = rsbuild.getDistFiles();
  expect(findFiles(files, '.css')).toHaveLength(1);
  expect(findFiles(files, '.js')).toHaveLength(1);
  expect(getFileContent(files, 'index.css')).toBe(
    'body{color:red;background-color:#00f}',
  );
  expect(getFileContent(files, 'index.html')).toContain(
    'href="/static/css/index.css"',
  );
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(255, 0, 0)');
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(0, 0, 255)',
  );
});
