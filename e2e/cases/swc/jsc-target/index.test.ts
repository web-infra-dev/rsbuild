import { expect, getFileContent, test } from '@e2e/helper';

test('should configure jsc.target correctly in dev', async ({ devOnly }) => {
  const rsbuild = await devOnly();
  const files = rsbuild.getDistFiles();
  const content = getFileContent(files, 'index.js');
  expect(content).not.toContain('...baz');
});

test('should configure jsc.target correctly in build', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const content = getFileContent(files, 'index.js');
  expect(content).not.toContain('...baz');
});
