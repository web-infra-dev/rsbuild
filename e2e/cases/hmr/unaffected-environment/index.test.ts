import fs from 'node:fs';
import { join } from 'node:path';
import { expect, gotoPage, rspackTest } from '@e2e/helper';

rspackTest(
  'should not affect other environments during HMR',
  async ({ cwd, page: page1, devOnly, editFile, context }) => {
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

    const page2 = await context.newPage();
    await gotoPage(page1, rsbuild, 'foo');
    await gotoPage(page2, rsbuild, 'bar');

    // Initial state
    await expect(page1.locator('body')).toHaveText('hello world');
    const button = page2.locator('#button');
    await expect(button).toHaveText('count: 0');
    await button.click();
    await expect(button).toHaveText('count: 1');

    // edit foo.js
    await editFile('test-temp-src/foo.js', (code) =>
      code.replace('hello world', 'changed'),
    );
    await expect(page1.locator('body')).toHaveText('changed');
    await expect(page2.locator('#button')).toHaveText('count: 1');
  },
);
