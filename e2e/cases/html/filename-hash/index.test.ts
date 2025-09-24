import { expect, test } from '@e2e/helper';

test('should allow to generate HTML with filename hash using filename.html', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      output: {
        filename: {
          html: '[name].[contenthash:8].html',
        },
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const htmlFilename = Object.keys(files).find((item) =>
    item.endsWith('.html'),
  );

  expect(/index.\w+.html/.test(htmlFilename!)).toBeTruthy();
});

test('should allow to generate HTML with filename hash using tools.htmlPlugin', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      tools: {
        htmlPlugin(config, { entryName }) {
          config.filename = `${entryName}.[contenthash:8].html`;
          return config;
        },
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const htmlFilename = Object.keys(files).find((item) =>
    item.endsWith('.html'),
  );

  expect(/index.\w+.html/.test(htmlFilename!)).toBeTruthy();
});
