import { expect, test } from '@e2e/helper';

test('should run a module worker built with the web-worker target', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async () => {
    await expect(page.locator('#root')).toHaveText('42');
  });
});
