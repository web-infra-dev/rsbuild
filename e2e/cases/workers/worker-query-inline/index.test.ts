import { expect, test } from '@e2e/helper';
import { findFiles } from '@rstackjs/test-utils';

test('should support inline worker query imports', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async ({ mode, result }) => {
    await expect(page.locator('#worker')).toHaveText(
      'named: 42 named inline-marker',
    );
    await expect(page.locator('#reordered')).toHaveText('reordered: 42');
    await expect(page.locator('#unicode')).toHaveText('\u2022pong\u2022');

    if (mode === 'build') {
      const files = result.getDistFiles();
      const jsFiles = findFiles(files, '.js');
      const emittedInlineWorkerFiles = findFiles(
        files,
        /inline-worker\.[\w-]+\.js$/,
        { ignoreHash: false },
      );

      expect(jsFiles).toHaveLength(1);
      expect(emittedInlineWorkerFiles).toEqual([]);
      expect(files[jsFiles[0]]).toContain('inline-marker');
    }
  });
});
