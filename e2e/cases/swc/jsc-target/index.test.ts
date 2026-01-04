import { expect, getFileContent, rspackTest } from '@e2e/helper';

rspackTest(
  'should configure jsc.target correctly in dev',
  async ({ devOnly }) => {
    const rsbuild = await devOnly();
    const files = rsbuild.getDistFiles();
    const content = getFileContent(files, 'index.js');
    expect(content).not.toContain('...a');
  },
);

rspackTest('should jsc.target correctly in build', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const content = getFileContent(files, 'index.js');
  expect(content).not.toContain('...a');
});
