import { expect, test } from '@e2e/helper';
import { getFileContent } from '@rstackjs/test-utils';

test('should build Vue SFC style correctly', async ({ page, buildPreview }) => {
  const rsbuild = await buildPreview();

  const button = page.locator('#button');
  await expect(button).toHaveCSS('color', 'rgb(255, 0, 0)');

  const body = page.locator('body');
  await expect(body).toHaveCSS('background-color', 'rgb(0, 0, 255)');

  const scopedText = page.locator('#scoped-text');
  await expect(scopedText).toHaveCSS('color', 'rgb(0, 128, 0)');

  const cssContent = getFileContent(rsbuild.getDistFiles(), '.css');
  expect(cssContent).toMatch(/#scoped-text\[data-v-[\da-f]+\]/);
});
