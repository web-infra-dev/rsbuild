import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should emit apple-touch-icon to dist path', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      html: {
        appIcon: {
          icons: [{ src: '../../../assets/icon.png', size: 180 }],
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  expect(
    Object.keys(files).some((file) => file.endsWith('static/image/icon.png')),
  ).toBeTruthy();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain(
    '<link rel="apple-touch-icon" sizes="180x180" href="/static/image/icon.png">',
  );
});

test('should apply asset prefix to apple-touch-icon URL', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      html: {
        appIcon: {
          icons: [{ src: '../../../assets/icon.png', size: 180 }],
        },
      },
      output: {
        assetPrefix: 'https://www.example.com',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const {
    origin: { bundlerConfigs },
  } = await rsbuild.instance.inspectConfig();

  expect(bundlerConfigs[0].output?.publicPath).toBe('https://www.example.com/');

  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain(
    '<link rel="apple-touch-icon" sizes="180x180" href="https://www.example.com/static/image/icon.png">',
  );
});
