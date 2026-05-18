import { expect, test } from '@e2e/helper';

test('should support inline worker query imports', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async ({ mode, result }) => {
    await expect(page.locator('#inline-worker')).toHaveText(
      'named-inline-worker: 42 named-inline-worker rsbuild-inline-worker-marker',
    );
    await expect(page.locator('#inline-worker-reordered')).toHaveText(
      'inline-worker-reordered: 42',
    );
    await expect(page.locator('#inline-worker-unicode')).toHaveText(
      '\u2022pong\u2022',
    );

    if (mode === 'build') {
      const files = result.getDistFiles();
      const emittedInlineWorkerFiles = Object.keys(files).filter((filename) =>
        /inline-worker\.[\w-]+\.js$/.test(filename),
      );

      expect(emittedInlineWorkerFiles).toEqual([]);
      expect(Object.values(files).join('\n')).toContain(
        'rsbuild-inline-worker-marker',
      );
    }
  });
});
