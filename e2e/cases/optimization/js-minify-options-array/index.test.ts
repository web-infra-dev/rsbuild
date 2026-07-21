import { expect, test } from '@e2e/helper';
import { getFileContent } from '@rstackjs/test-utils';

test('should apply different JS minify options to different assets', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const foo = getFileContent(files, 'static/js/foo.js');
  const bar = getFileContent(files, 'static/js/bar.js');

  expect(foo).not.toContain('foo-console');
  expect(foo).toContain('foo-result');
  expect(bar).not.toContain('bar-remove');
  expect(bar).toContain('bar-keep');
});
