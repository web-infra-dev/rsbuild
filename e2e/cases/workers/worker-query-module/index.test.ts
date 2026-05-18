import { expect, getFileContent, test } from '@e2e/helper';

test('should support worker query imports with output.module enabled', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async ({ mode, result }) => {
    await expect(page.locator('#module-worker')).toHaveText(
      'module-worker: module message',
    );
    await expect(page.locator('#module-inline-worker')).toHaveText(
      'inline-module-worker: inline module message',
    );

    if (mode === 'build') {
      const files = result.getDistFiles();
      const html = getFileContent(files, 'index.html');

      expect(html).toContain('type="module"');
      expect(Object.values(files).join('\n')).toContain('type:"module"');
    }
  });
});
