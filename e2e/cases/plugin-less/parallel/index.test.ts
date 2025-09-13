import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should compile less with `parallel` option in build',
  async ({ build }) => {
    const rsbuild = await build();
    const files = rsbuild.getDistFiles();
    const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;
    expect(files[cssFiles]).toEqual(
      'body{background-color:red;font-size:16px}div{font-size:14px}h1{font-size:18px;font-weight:700}p{font-size:15px}',
    );
  },
);

rspackTest(
  'should compile less with `parallel` option in dev',
  async ({ page, dev }) => {
    await dev();
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', 'rgb(255, 0, 0)');
    await expect(body).toHaveCSS('font-size', '16px');
  },
);
