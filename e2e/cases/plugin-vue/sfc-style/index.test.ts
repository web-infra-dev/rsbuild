import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should build Vue SFC style correctly',
  async ({ page, build }) => {
    await build();

    const button = page.locator('#button');
    await expect(button).toHaveCSS('color', 'rgb(255, 0, 0)');

    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', 'rgb(0, 0, 255)');
  },
);
