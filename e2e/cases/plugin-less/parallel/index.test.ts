import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

rspackOnlyTest(
  'should compile less with `parallel` option in production mode',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
    });

    const files = await rsbuild.getDistFiles();
    const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

    expect(files[cssFiles]).toEqual(
      'body{background-color:red;font-size:16px}div{font-size:14px}h1{font-size:18px;font-weight:700}p{font-size:15px}',
    );

    await rsbuild.close();
  },
);

test('should compile less with `parallel` option in development mode', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  const body = page.locator('body');
  await expect(body).toHaveCSS('background-color', 'rgb(255, 0, 0)');
  await expect(body).toHaveCSS('font-size', '16px');
  await rsbuild.close();
});
