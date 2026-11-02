import { expect, test } from '@e2e/helper';

test('should replace static and optional NODE_ENV property access', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async ({ mode }) => {
    const value = mode === 'dev' ? 'development' : 'production';
    await expect(page.locator('#root')).toHaveText(
      JSON.stringify({ dot: value, bracket: value, optional: value }),
    );
  });
});
