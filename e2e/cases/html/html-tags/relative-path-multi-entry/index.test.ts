import { expect, getFileContent, test } from '@e2e/helper';

test('should handle relative paths correctly for multiple entries in subdirectories', async ({
  build,
}) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();

  // index.html should have the path relative to root
  const indexHtml = getFileContent(files, 'index.html');
  expect(
    indexHtml.includes('src="env-config.js"') || indexHtml.includes('src="./env-config.js"'),
  ).toBeTruthy();
  expect(indexHtml).not.toContain('src="../env-config.js"');
  expect(indexHtml).not.toContain('src="../../env-config.js"');

  // subdir/main.html should have the path relative to the subdirectory
  const mainHtml = getFileContent(files, 'subdir/main.html');
  expect(mainHtml).toContain('src="../env-config.js"');
  expect(mainHtml).not.toContain('src="env-config.js"');
  expect(mainHtml).not.toContain('src="./env-config.js"');
  expect(mainHtml).not.toContain('src="../../env-config.js"');

  // subdir/test.html should also have the path relative to the subdirectory
  // This is the case where the bug occurred - the second entry in the same subdir
  // should have the same path as main.html
  const testHtml = getFileContent(files, 'subdir/test.html');
  expect(testHtml).toContain('src="../env-config.js"');
  expect(testHtml).not.toContain('src="env-config.js"');
  expect(testHtml).not.toContain('src="./env-config.js"');
  expect(testHtml).not.toContain('src="../../env-config.js"');
});
