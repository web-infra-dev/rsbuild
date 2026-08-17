import { expect, test } from '@e2e/helper';
import { findFile } from '@rstackjs/test-utils';

test('should support dynamic imports inside module worker query imports', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async ({ mode, result }) => {
    await expect(page.locator('#worker')).toHaveText('worker: async msg');

    if (mode === 'build') {
      expect(
        findFile(result.getDistFiles(), 'static/js/async/worker-async.js'),
      ).toBeTruthy();
    }
  });
});
