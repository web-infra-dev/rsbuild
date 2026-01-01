import { join } from 'node:path';
import { expect, rspackTest, test } from '@e2e/helper';

rspackTest(
  'should not reload page when HTML template changed with skipHtmlPageReload enabled',
  async ({ page, dev, editFile, copySrcDir }) => {
    // Failed to run this case on Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    const tempSrc = await copySrcDir();

    await dev({
      config: {
        dev: {
          hmr: {
            skipHtmlPageReload: true,
          },
        },
      },
    });

    await expect(page).toHaveTitle('Foo');

    await editFile(join(tempSrc, 'index.html'), (code) =>
      code.replace('Foo', 'Bar'),
    );
    // expect page title to still be 'Foo' after HTML template changed
    await expect(page).toHaveTitle('Foo');
  },
);
