import { expect, test } from '@e2e/helper';
import { findFile, getFileContent } from '@rstackjs/test-utils';

test('should load split and runtime chunks in web ESM bundles', async ({ page, runBothServe }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await runBothServe(async ({ mode, result }) => {
    await expect(page.locator('#test')).toHaveText('Initial chunks loaded!');

    if (mode === 'build') {
      const files = result.getDistFiles();
      const initialJsFiles = Object.keys(files).filter(
        (filename) =>
          filename.endsWith('.js') &&
          filename.includes('/static/js/') &&
          !filename.includes('/async/'),
      );

      expect(initialJsFiles).toHaveLength(3);
      expect(findFile(files, 'static/js/index.js')).toBeTruthy();
      expect(findFile(files, 'static/js/shared.js')).toBeTruthy();
      expect(findFile(files, 'static/js/runtime.js')).toBeTruthy();

      const html = getFileContent(files, 'index.html');
      expect(html.match(/<script type="module"/g)).toHaveLength(3);
    }
  });

  expect(pageErrors).toEqual([]);
});
