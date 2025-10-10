import { join } from 'node:path';
import { expect, rspackTest, test } from '@e2e/helper';

rspackTest(
  'should reload page when HTML template changed',
  async ({ page, dev, editFile, copySrcDir }) => {
    // Failed to run this case on Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    const tempSrc = await copySrcDir();

    await dev();

    await expect(page).toHaveTitle('Foo');

    await editFile(join(tempSrc, 'index.html'), (code) =>
      code.replace('Foo', 'Bar'),
    );
    // expect page title to be 'Bar' after HTML template changed
    await expect(page).toHaveTitle('Bar');
  },
);
