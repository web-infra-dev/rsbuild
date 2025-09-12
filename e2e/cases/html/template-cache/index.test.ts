import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { expect, rspackOnlyTest, test } from '@e2e/helper';
import type { RsbuildPlugin } from '@rsbuild/core';
import fse from 'fs-extra';

// https://github.com/web-infra-dev/rsbuild/issues/5176
rspackOnlyTest(
  'should not re-compile templates when the template is not changed',
  async ({ dev, page }) => {
    // Failed to run this case on Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    let count = 0;

    const targetDir = join(__dirname, 'test-temp-src');
    await fse.remove(targetDir);
    await fs.cp(join(__dirname, 'src'), targetDir, {
      recursive: true,
    });

    await dev({
      rsbuildConfig: {
        root: targetDir,
        source: {
          entry: {
            index: './index.js',
            bar: './bar.js',
          },
        },
        html: {
          template: ({ entryName }) => `./${entryName}.html`,
        },
        plugins: [
          {
            name: 'test-plugin',
            setup(api) {
              api.transform({ test: /\.html$/ }, ({ code }) => {
                count++;
                return `export default \`${code}\`;`;
              });
            },
          } satisfies RsbuildPlugin,
        ],
      },
    });

    await expect(page.locator('#root')).toHaveText('foo');
    expect(count).toEqual(2);

    // Re-compile the template when the template is changed
    const indexHtmlPath = join(targetDir, 'index.html');
    const indexHtml = await fs.readFile(indexHtmlPath, 'utf-8');
    await fs.writeFile(indexHtmlPath, indexHtml.replace('foo', 'foo2'));
    await expect(page.locator('#root')).toHaveText('foo2');
    // The count will be 4 as the childCompiler in html-rspack-plugin
    // will compile all the templates
    expect(count).toEqual(4);

    const indexJsPath = join(targetDir, 'index.js');
    const indexJs = await fs.readFile(indexJsPath, 'utf-8');
    await fs.writeFile(indexJsPath, indexJs.replace('foo', 'foo3'));
    await expect(page.locator('#content')).toHaveText('foo3');
    // The count should not change if the templates are not changed
    expect(count).toEqual(4);
  },
);
