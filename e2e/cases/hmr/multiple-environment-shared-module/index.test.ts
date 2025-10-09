import fs from 'node:fs';
import { join } from 'node:path';
import { expect, gotoPage, rspackTest } from '@e2e/helper';

rspackTest(
  'should perform HMR for multiple environments with shared module',
  async ({ cwd, page, devOnly, editFile }) => {
    const tempSrc = join(cwd, 'test-temp-src');
    await fs.promises.cp(join(cwd, 'src'), tempSrc, {
      recursive: true,
    });

    const rsbuild = await devOnly({
      config: {
        environments: {
          foo: {
            source: {
              entry: {
                foo: join(tempSrc, 'foo.js'),
              },
            },
          },
          bar: {
            source: {
              entry: {
                bar: join(tempSrc, 'bar.js'),
              },
            },
          },
        },
      },
    });

    const expectValue = async (value: string) => {
      const locator = page.locator('body');
      await expect(locator).toHaveText(value);
    };

    await gotoPage(page, rsbuild, 'foo');
    await expectValue('foo:hello');
    await gotoPage(page, rsbuild, 'bar');
    await expectValue('bar:hello');

    // edit shared module
    await editFile('test-temp-src/shared.js', (code) =>
      code.replace('hello', 'world'),
    );
    await gotoPage(page, rsbuild, 'foo');
    await expectValue('foo:world');
    await gotoPage(page, rsbuild, 'bar');
    await expectValue('bar:world');

    // edit foo entry module
    await editFile('test-temp-src/foo.js', (code) =>
      code.replace('foo', 'foo2'),
    );
    await gotoPage(page, rsbuild, 'foo');
    await expectValue('foo2:world');

    // edit bar entry module
    await editFile('test-temp-src/bar.js', (code) =>
      code.replace('bar', 'bar2'),
    );
    await gotoPage(page, rsbuild, 'bar');
    await expectValue('bar2:world');
  },
);
