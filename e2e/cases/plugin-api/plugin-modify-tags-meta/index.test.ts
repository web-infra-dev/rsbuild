import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow plugin to modify HTML tags with metadata',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly();

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
