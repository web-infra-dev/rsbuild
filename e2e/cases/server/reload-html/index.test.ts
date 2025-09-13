import fs from 'node:fs';
import { join } from 'node:path';
import { expect, rspackTest, test } from '@e2e/helper';

const cwd = __dirname;

rspackTest(
  'should reload page when HTML template changed',
  async ({ page, dev, editFile }) => {
    // Failed to run this case on Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
      recursive: true,
    });

    await dev();

    await expect(page).toHaveTitle('Foo');

    await editFile('test-temp-src/index.html', (code) =>
      code.replace('Foo', 'Bar'),
    );
    // expect page title to be 'Bar' after HTML template changed
    await expect(page).toHaveTitle('Bar');
  },
);
