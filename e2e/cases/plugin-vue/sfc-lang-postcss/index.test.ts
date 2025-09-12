import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should build Vue SFC with lang="postcss" correctly',
  async ({ page, build }) => {
    const rsbuild = await build();

    const button = page.locator('#button');
    await expect(button).toHaveCSS('color', 'rgb(255, 0, 0)');
  },
);
