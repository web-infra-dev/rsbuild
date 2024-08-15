import { build, dev, gotoPage } from '@e2e/helper';
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

test('should emit manifest.webmanifest to dist path', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      html: {
        appIcon: {
          name: 'My Website',
          icons: [
            { src: '../../../assets/icon.png', size: 180 },
            { src: '../../../assets/image.png', size: 512 },
          ],
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  expect(
    Object.keys(files).some((file) => file.endsWith('static/image/icon.png')),
  ).toBeTruthy();
  expect(
    Object.keys(files).some((file) => file.endsWith('static/image/image.png')),
  ).toBeTruthy();

  const manifestPath = Object.keys(files).find((file) =>
    file.endsWith('manifest.webmanifest'),
  );
  expect(manifestPath).toBeTruthy();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain(
    '<link rel="apple-touch-icon" sizes="180x180" href="/static/image/icon.png">',
  );
  // do not generate apple-touch-icon for large images
  expect(html).not.toContain(
    '<link rel="apple-touch-icon" sizes="512x512" href="/static/image/image.png">',
  );
  expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest">');

  expect(JSON.parse(files[manifestPath!])).toEqual({
    name: 'My Website',
    icons: [
      { src: '/static/image/icon.png', sizes: '180x180' },
      { src: '/static/image/image.png', sizes: '512x512' },
    ],
  });
});

test('should append dev.assetPrefix to icon URL', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {
      dev: {
        assetPrefix: 'http://localhost:3000',
        writeToDisk: true,
      },
      html: {
        appIcon: {
          name: 'My Website',
          icons: [
            { src: '../../../assets/icon.png', size: 180 },
            { src: '../../../assets/image.png', size: 512 },
          ],
        },
      },
    },
  });

  await gotoPage(page, rsbuild);

  const files = await rsbuild.unwrapOutputJSON();

  expect(
    Object.keys(files).some((file) => file.endsWith('static/image/icon.png')),
  ).toBeTruthy();
  expect(
    Object.keys(files).some((file) => file.endsWith('static/image/image.png')),
  ).toBeTruthy();

  const manifestPath = Object.keys(files).find((file) =>
    file.endsWith('manifest.webmanifest'),
  );
  expect(manifestPath).toBeTruthy();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain(
    '<link rel="apple-touch-icon" sizes="180x180" href="http://localhost:3000/static/image/icon.png">',
  );
  expect(html).toContain(
    '<link rel="manifest" href="http://localhost:3000/manifest.webmanifest">',
  );

  expect(JSON.parse(files[manifestPath!])).toEqual({
    name: 'My Website',
    icons: [
      { src: 'http://localhost:3000/static/image/icon.png', sizes: '180x180' },
      { src: 'http://localhost:3000/static/image/image.png', sizes: '512x512' },
    ],
  });

  await rsbuild.close();
});

test('should append output.assetPrefix to icon URL', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        assetPrefix: 'https://example.com',
      },
      html: {
        appIcon: {
          name: 'My Website',
          icons: [
            { src: '../../../assets/icon.png', size: 180 },
            { src: '../../../assets/image.png', size: 512 },
          ],
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  expect(
    Object.keys(files).some((file) => file.endsWith('static/image/icon.png')),
  ).toBeTruthy();
  expect(
    Object.keys(files).some((file) => file.endsWith('static/image/image.png')),
  ).toBeTruthy();

  const manifestPath = Object.keys(files).find((file) =>
    file.endsWith('manifest.webmanifest'),
  );
  expect(manifestPath).toBeTruthy();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain(
    '<link rel="apple-touch-icon" sizes="180x180" href="https://example.com/static/image/icon.png">',
  );
  expect(html).toContain(
    '<link rel="manifest" href="https://example.com/manifest.webmanifest">',
  );

  expect(JSON.parse(files[manifestPath!])).toEqual({
    name: 'My Website',
    icons: [
      { src: 'https://example.com/static/image/icon.png', sizes: '180x180' },
      { src: 'https://example.com/static/image/image.png', sizes: '512x512' },
    ],
  });
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
