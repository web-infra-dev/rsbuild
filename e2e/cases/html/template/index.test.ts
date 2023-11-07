import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should set template via function correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.ts'),
      foo: path.resolve(__dirname, './src/foo.js'),
    },
    rsbuildConfig: {
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
