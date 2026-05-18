import { expect, test } from '@e2e/helper';

test('should support worker query imports with output.module enabled', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async ({ mode, result }) => {
    await expect(page.locator('#worker')).toHaveText('worker: msg');
    await expect(page.locator('#inline')).toHaveText('inline: msg');

    if (mode === 'build') {
      const files = result.getDistFiles();

      expect(Object.values(files).join('\n')).toContain('type:"module"');
    }
  });
});
