import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should compile less with `parallel` option in build',
  async ({ build, buildOnly }) => {
    const rsbuild = await buildOnly();

    const files = rsbuild.getDistFiles();
    const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

    expect(files[cssFiles]).toEqual(
      'body{background-color:red;font-size:16px}div{font-size:14px}h1{font-size:18px;font-weight:700}p{font-size:15px}',
    );
  },
);

rspackOnlyTest(
  'should compile less with `parallel` option in dev',
  async ({ page, dev }) => {
    await dev();

    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', 'rgb(255, 0, 0)');
    await expect(body).toHaveCSS('font-size', '16px');
  },
);
