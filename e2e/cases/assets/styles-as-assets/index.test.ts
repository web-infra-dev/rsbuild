import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should allow to use `new URL` to reference styles as assets',
  async ({ page, buildPreview }) => {
    const rsbuild = await buildPreview();

    const files = rsbuild.getDistFiles();
    const filenames = Object.keys(files);

    const test1 = filenames.find((filename) =>
      filename.includes('dist/static/assets/test1.css'),
    );
    const test2 = filenames.find((filename) =>
      filename.includes('dist/static/assets/test2.less'),
    );
    const test3 = filenames.find((filename) =>
      filename.includes('dist/static/assets/test3.scss'),
    );
    const test4 = filenames.find((filename) =>
      filename.includes('dist/static/assets/test4.styl'),
    );

    expect(test1).toBeDefined();
    expect(test2).toBeDefined();
    expect(test3).toBeDefined();
    expect(test4).toBeDefined();
    expect(files[test1!]).toContain('body{color:red}');
    expect(files[test2!]).toContain('& .foo');
    expect(files[test3!]).toContain('& .foo');
    expect(files[test4!]).toContain('color yellow');
    expect(await page.evaluate('window.test1')).toBe(
      `http://localhost:${rsbuild.port}/static/assets/test1.css`,
    );
    expect(await page.evaluate('window.test2')).toBe(
      `http://localhost:${rsbuild.port}/static/assets/test2.less`,
    );
    expect(await page.evaluate('window.test3')).toBe(
      `http://localhost:${rsbuild.port}/static/assets/test3.scss`,
    );
    expect(await page.evaluate('window.test4')).toBe(
      `http://localhost:${rsbuild.port}/static/assets/test4.styl`,
    );
  },
);
