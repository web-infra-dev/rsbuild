import { expect, test } from '@e2e/helper';
import { getFileContent } from '@rstackjs/test-utils';

test('should apply different CSS minify options to different assets', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const foo = getFileContent(files, 'static/css/foo.css');
  const bar = getFileContent(files, 'static/css/bar.css');

  expect(foo).not.toContain('.foo-unused');
  expect(foo).toContain('.foo-keep');
  expect(bar).not.toContain('.bar-unused');
  expect(bar).toContain('.bar-keep');
});
