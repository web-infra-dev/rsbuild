import { build, expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow to use html-loader in development',
  async ({ dev }) => {
    const rsbuild = await dev();

    const files = rsbuild.getDistFiles();
    const filenames = Object.keys(files);

    expect(
      filenames.some((filename) =>
        filename.includes('dist/static/image/image.png'),
      ),
    ).toBeTruthy();

    const htmlFile = filenames.find((filename) => filename.endsWith('.html'));
    expect(files[htmlFile!]).toContain('<img src="/static/image/image.png"');
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
