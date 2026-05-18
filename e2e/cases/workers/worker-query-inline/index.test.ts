import { expect, test } from '@e2e/helper';

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
      const emittedInlineWorkerFiles = Object.keys(files).filter((filename) =>
        /inline-worker\.[\w-]+\.js$/.test(filename),
      );

      expect(emittedInlineWorkerFiles).toEqual([]);
      expect(Object.values(files).join('\n')).toContain('inline-marker');
    }
  });
});
