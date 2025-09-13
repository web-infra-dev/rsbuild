import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should allow plugin to modify HTML tags with metadata',
  async ({ build }) => {
    const rsbuild = await build();

    const files = rsbuild.getDistFiles();
    const indexHTML = Object.keys(files).find(
      (file) => file.includes('index') && file.endsWith('.html'),
    );

    const html = files[indexHTML!];

    expect(
      html.includes(
        '<script src="https://example.com/script.js" id="foo"></script>',
      ),
    ).toBeTruthy();
  },
);
