import { expect, test } from '@e2e/helper';

test('should support self reference worker query imports', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async ({ result }) => {
    await result.expectWarning(
      'Circular dependency between chunks with runtime',
    );
    await expect(page.locator('#worker')).toContainText('pong: main');
    await expect(page.locator('#worker')).toContainText('pong: nested');
  });
});
