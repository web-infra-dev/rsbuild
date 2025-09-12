import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should build basic Vue jsx correctly',
  async ({ page, build }) => {
    const rsbuild = await build();

    const reactUrl = new URL(`http://localhost:${rsbuild.port}/react`);

    await page.goto(reactUrl.href);

    await expect(page.locator('#test')).toHaveText('Hello Rsbuild!');

    const vueUrl = new URL(`http://localhost:${rsbuild.port}/vue`);

    await page.goto(vueUrl.href);

    const button1 = page.locator('#button1');
    await expect(button1).toHaveText('A: 0');
  },
);
