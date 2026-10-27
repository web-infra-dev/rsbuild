import { expect, test } from '@e2e/helper';

test('should preserve externals in module workers', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async () => {
    await expect(page.locator('#root')).toHaveText('external module');
  });
});
