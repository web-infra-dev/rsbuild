import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should allow plugin to modify HTML tags with metadata',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
    });

    const files = await rsbuild.getDistFiles();
    const indexHTML = Object.keys(files).find(
      (file) => file.includes('index') && file.endsWith('.html'),
    );

    const html = files[indexHTML!];

    expect(
      html.includes(
        '<script src="https://example.com/script.js" id="foo"></script>',
      ),
    ).toBeTruthy();

    await rsbuild.close();
  },
);
