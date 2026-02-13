import { expect, getFileContent, test } from '@e2e/helper';

test('should configure jsc.target correctly', async ({ runDevAndBuild }) => {
  await runDevAndBuild(
    async ({ result }) => {
      const files = result.getDistFiles();
      const content = getFileContent(files, 'index.js');
      expect(content).not.toContain('...baz');
    },
    { serve: false },
  );
});
