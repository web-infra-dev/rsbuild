import { expect, test } from '@e2e/helper';

test('should support worker query imports inside workers', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async () => {
    await expect(page.locator('#nested-worker')).toHaveText(
      /nested-worker http/,
    );
    await expect(page.locator('#nested-sub-worker')).toHaveText(
      'sub-worker:nested-sub-worker',
    );
    await expect(page.locator('#nested-constructor-worker')).toHaveText(
      'constructor-worker',
    );
  });
});
