import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should allow to use html-loader in development',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });

    const files = rsbuild.getDistFiles();
    const filenames = Object.keys(files);

    expect(
      filenames.some((filename) =>
        filename.includes('dist/static/image/image.png'),
      ),
    ).toBeTruthy();

    const htmlFile = filenames.find((filename) => filename.endsWith('.html'));
    expect(files[htmlFile!]).toContain('<img src="/static/image/image.png"');

    await rsbuild.close();
  },
);

rspackOnlyTest('should allow to use html-loader in production', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = rsbuild.getDistFiles();
  const filenames = Object.keys(files);

  expect(
    filenames.some((filename) =>
      filename.includes('dist/static/image/image.png'),
    ),
  ).toBeTruthy();

  const htmlFile = filenames.find((filename) => filename.endsWith('.html'));
  expect(files[htmlFile!]).toContain('<img src="/static/image/image.png"');
});
