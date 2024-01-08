import path from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

test('should set template via function correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
        entry: {
          index: path.resolve(__dirname, './src/index.js'),
          foo: path.resolve(__dirname, './src/foo.js'),
        },
      },
      html: {
        template({ entryName }) {
          return entryName === 'index'
            ? './static/index.html'
            : './static/foo.html';
        },
        templateParameters: {
          foo: 'foo',
          type: 'type',
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const fooHtml =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(fooHtml).toContain('<div id="test-template">foo</div>');

  const indexHtml =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  expect(indexHtml).toContain('<div id="test-template">xxx</div>');
});

test('should allow to access templateParameters', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      html: {
        template: './static/index.html',
        templateParameters: {
          foo: 'bar',
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const testTemplate = page.locator('#test-template');
  await expect(testTemplate).toHaveText('xxx');

  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');

  await expect(page.evaluate('window.foo')).resolves.toBe('bar');

  await rsbuild.close();
});
