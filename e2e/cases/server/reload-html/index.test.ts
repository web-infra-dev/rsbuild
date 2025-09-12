import fs from 'node:fs';
import { join } from 'node:path';
import { expect, rspackOnlyTest, test } from '@e2e/helper';

const cwd = __dirname;

rspackOnlyTest(
  'should reload page when HTML template changed',
  async ({ page, dev }) => {
    // Failed to run this case on Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
      recursive: true,
    });

    await dev();

    await expect(page).toHaveTitle('Foo');

    const templatePath = join(cwd, 'test-temp-src/index.html');
    await fs.promises.writeFile(
      templatePath,
      fs.readFileSync(templatePath, 'utf-8').replace('Foo', 'Bar'),
    );
    // expect page title to be 'Bar' after HTML template changed
    await expect(page).toHaveTitle('Bar');
  },
);
