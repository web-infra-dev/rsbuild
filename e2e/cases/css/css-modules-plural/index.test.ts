import { expect, test } from '@e2e/helper';

test('should recognize .modules.* files as CSS Modules by default', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async () => {
    for (const [extension, color] of [
      ['css', 'rgb(255, 0, 0)'],
      ['scss', 'rgb(0, 0, 255)'],
      ['less', 'rgb(0, 128, 0)'],
    ]) {
      const element = page.locator(`#${extension}`);
      await expect(element).toHaveCSS('color', color);
    }
  });
});
