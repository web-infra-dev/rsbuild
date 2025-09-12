import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to generate HTML with filename hash using filename.html', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        filename: {
          html: '[name].[contenthash:8].html',
        },
      },
    },
  });

  const outputs = rsbuild.getDistFiles();
  const htmlFilename = Object.keys(outputs).find((item) =>
    item.endsWith('.html'),
  );

  expect(/index.\w+.html/.test(htmlFilename!)).toBeTruthy();
  await rsbuild.close();
});

test('should allow to generate HTML with filename hash using tools.htmlPlugin', async () => {
  const rsbuild = await build({
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

  const outputs = rsbuild.getDistFiles();
  const htmlFilename = Object.keys(outputs).find((item) =>
    item.endsWith('.html'),
  );

  expect(/index.\w+.html/.test(htmlFilename!)).toBeTruthy();
  await rsbuild.close();
});
