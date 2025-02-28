import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should build basic Vue jsx correctly', async ({ page }) => {
  console.time('rsbuild');
  console.log('start: ', process.pid, Date.now());

  const rsbuild = await build({
    cwd: __dirname,
    page,
  });
  console.log('end  : ', process.pid, Date.now());

  console.timeEnd('rsbuild');

  console.time('react');

  const reactUrl = new URL(`http://localhost:${rsbuild.port}/react`);

  await page.goto(reactUrl.href);

  await expect(page.locator('#test')).toHaveText('Hello Rsbuild!');

  console.timeEnd('react');

  console.time('vue');
  const vueUrl = new URL(`http://localhost:${rsbuild.port}/vue`);

  await page.goto(vueUrl.href);

  const button1 = page.locator('#button1');
  await expect(button1).toHaveText('A: 0');

  console.timeEnd('vue');

  await rsbuild.close();
});
