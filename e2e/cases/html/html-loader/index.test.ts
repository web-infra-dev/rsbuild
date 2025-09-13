import { expect, rspackTest } from '@e2e/helper';

rspackTest(
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

rspackTest(
  'should allow to use html-loader in production',
  async ({ build }) => {
    const rsbuild = await build();

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
