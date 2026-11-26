import { expect, test } from '@e2e/helper';

test('should build Vue custom element inline styles correctly', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async () => {
    const ceText = page.locator('my-element #ce-text');
    await expect(ceText).toHaveCSS('color', 'rgb(255, 0, 0)');
  });
});
