import { join } from 'node:path';
import { build, readDirContents } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to generate HTML with filename hash using filename.html', async () => {
  await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        filename: {
          html: '[name].[contenthash:8].html',
        },
      },
    },
  });

  const outputs = await readDirContents(join(__dirname, 'dist'));
  const htmlFilename = Object.keys(outputs).find((item) =>
    item.endsWith('.html'),
  );

  expect(/index.\w+.html/.test(htmlFilename!)).toBeTruthy();
});

test('should allow to generate HTML with filename hash using tools.htmlPlugin', async () => {
  await build({
    cwd: __dirname,
    rsbuildConfig: {
      tools: {
        htmlPlugin(config, { entryName }) {
          config.filename = `${entryName}.[contenthash:8].html`;
          return config;
        },
      },
    },
  });

  const outputs = await readDirContents(join(__dirname, 'dist'));
  const htmlFilename = Object.keys(outputs).find((item) =>
    item.endsWith('.html'),
  );

  expect(/index.\w+.html/.test(htmlFilename!)).toBeTruthy();
});
