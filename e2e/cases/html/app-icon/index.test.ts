import { expect, findFile, getFileContent, test } from '@e2e/helper';

test('should emit apple-touch-icon to dist path', async ({ build }) => {
  const rsbuild = await build({
    config: {
      html: {
        appIcon: {
          icons: [{ src: '../../../assets/icon.png', size: 180 }],
        },
      },
    },
  });
  const files = rsbuild.getDistFiles();
  const appleIcon = findFile(files, 'static/image/icon.png');

  expect(appleIcon.endsWith('static/image/icon.png')).toBeTruthy();

  const html = getFileContent(files, 'index.html');

  expect(html).toContain(
    '<link href="/static/image/icon.png" rel="apple-touch-icon" sizes="180x180">',
  );
});

test('should emit manifest.webmanifest to dist path', async ({ build }) => {
  const rsbuild = await build({
    config: {
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
  const files = rsbuild.getDistFiles();
  const appleIcon = findFile(files, 'static/image/icon.png');
  const largeIcon = findFile(files, 'static/image/image.png');

  expect(appleIcon.endsWith('static/image/icon.png')).toBeTruthy();
  expect(largeIcon.endsWith('static/image/image.png')).toBeTruthy();

  const manifestPath = findFile(files, 'manifest.webmanifest');
  const html = getFileContent(files, 'index.html');

  expect(html).toContain(
    '<link href="/static/image/icon.png" rel="apple-touch-icon" sizes="180x180">',
  );
  // do not generate apple-touch-icon for large images
  expect(html).not.toContain(
    '<link href="/static/image/image.png" rel="apple-touch-icon" sizes="512x512">',
  );
  expect(html).toContain('<link href="/manifest.webmanifest" rel="manifest">');

  expect(JSON.parse(files[manifestPath])).toEqual({
    name: 'My Website',
    icons: [
      { src: '/static/image/icon.png', sizes: '180x180', type: 'image/png' },
      { src: '/static/image/image.png', sizes: '512x512', type: 'image/png' },
    ],
  });
});

test('should allow to specify URL as icon', async ({ build }) => {
  const rsbuild = await build({
    config: {
      html: {
        appIcon: {
          name: 'My Website',
          icons: [
            { src: 'https://example.com/icon-192.png', size: 192 },
            { src: 'https://example.com/icon-512.png', size: 512 },
          ],
        },
      },
    },
  });
  const files = rsbuild.getDistFiles();

  const manifestPath = findFile(files, 'manifest.webmanifest');
  const html = getFileContent(files, 'index.html');

  expect(html).toContain(
    '<link href="https://example.com/icon-192.png" rel="apple-touch-icon" sizes="192x192">',
  );
  expect(html).toContain('<link href="/manifest.webmanifest" rel="manifest">');

  expect(JSON.parse(files[manifestPath])).toEqual({
    name: 'My Website',
    icons: [
      {
        src: 'https://example.com/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://example.com/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  });
});

test('should allow to specify target for each icon', async ({ build }) => {
  const rsbuild = await build({
    config: {
      html: {
        appIcon: {
          name: 'My Website',
          icons: [
            {
              src: '../../../assets/icon.png',
              size: 180,
              target: 'apple-touch-icon',
            },
            {
              src: '../../../assets/circle.svg',
              size: 192,
              target: 'web-app-manifest',
            },
            {
              src: '../../../assets/image.png',
              size: 512,
              target: 'web-app-manifest',
            },
          ],
        },
      },
    },
  });
  const files = rsbuild.getDistFiles();
  const appleIcon = findFile(files, 'static/image/icon.png');
  const largeIcon = findFile(files, 'static/image/image.png');
  const svgIcon = findFile(files, 'static/image/circle.svg');

  expect(appleIcon.endsWith('static/image/icon.png')).toBeTruthy();
  expect(largeIcon.endsWith('static/image/image.png')).toBeTruthy();
  expect(svgIcon.endsWith('static/image/circle.svg')).toBeTruthy();

  const manifestPath = findFile(files, 'manifest.webmanifest');
  const html = getFileContent(files, 'index.html');

  expect(html).toContain(
    '<link href="/static/image/icon.png" rel="apple-touch-icon" sizes="180x180">',
  );
  // do not generate apple-touch-icon for large images
  expect(html).not.toContain(
    '<link href="/static/image/image.png" rel="apple-touch-icon" sizes="512x512">',
  );
  expect(html).not.toContain(
    '<link href="/static/image/circle.svg" rel="apple-touch-icon" sizes="192x192">',
  );
  expect(html).toContain('<link href="/manifest.webmanifest" rel="manifest">');

  expect(JSON.parse(files[manifestPath])).toEqual({
    name: 'My Website',
    icons: [
      {
        src: '/static/image/circle.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      { src: '/static/image/image.png', sizes: '512x512', type: 'image/png' },
    ],
  });
});

test('should allow to specify purpose for each icon', async ({ build }) => {
  const rsbuild = await build({
    config: {
      html: {
        appIcon: {
          name: 'My Website',
          icons: [
            {
              src: '../../../assets/circle.svg',
              size: 192,
              target: 'web-app-manifest',
              purpose: 'monochrome',
            },
            {
              src: '../../../assets/image.png',
              size: 512,
              target: 'web-app-manifest',
              purpose: 'maskable',
            },
          ],
        },
      },
    },
  });
  const files = rsbuild.getDistFiles();
  const manifestPath = findFile(files, 'manifest.webmanifest');

  expect(JSON.parse(files[manifestPath])).toEqual({
    name: 'My Website',
    icons: [
      {
        src: '/static/image/circle.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'monochrome',
      },
      {
        src: '/static/image/image.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  });
});

test('should allow to customize manifest filename', async ({ build }) => {
  const rsbuild = await build({
    config: {
      html: {
        appIcon: {
          filename: 'manifest.json',
          name: 'My Website',
          icons: [
            { src: '../../../assets/icon.png', size: 180 },
            { src: '../../../assets/image.png', size: 512 },
          ],
        },
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const manifestPath = findFile(files, 'manifest.json');
  const html = getFileContent(files, 'index.html');

  expect(html).toContain('<link href="/manifest.json" rel="manifest">');

  expect(JSON.parse(files[manifestPath])).toEqual({
    name: 'My Website',
    icons: [
      { src: '/static/image/icon.png', sizes: '180x180', type: 'image/png' },
      { src: '/static/image/image.png', sizes: '512x512', type: 'image/png' },
    ],
  });
});

test('should append dev.assetPrefix to icon URL', async ({ dev }) => {
  const rsbuild = await dev({
    config: {
      dev: {
        assetPrefix: 'http://localhost:3000',
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

  const files = rsbuild.getDistFiles();
  const appleIcon = findFile(files, 'static/image/icon.png');
  const largeIcon = findFile(files, 'static/image/image.png');

  expect(appleIcon.endsWith('static/image/icon.png')).toBeTruthy();
  expect(largeIcon.endsWith('static/image/image.png')).toBeTruthy();

  const manifestPath = findFile(files, 'manifest.webmanifest');
  const html = getFileContent(files, 'index.html');

  expect(html).toContain(
    '<link href="http://localhost:3000/static/image/icon.png" rel="apple-touch-icon" sizes="180x180">',
  );
  expect(html).toContain(
    '<link href="http://localhost:3000/manifest.webmanifest" rel="manifest">',
  );

  expect(JSON.parse(files[manifestPath])).toEqual({
    name: 'My Website',
    icons: [
      {
        src: 'http://localhost:3000/static/image/icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: 'http://localhost:3000/static/image/image.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  });
});

test('should append output.assetPrefix to icon URL', async ({ build }) => {
  const rsbuild = await build({
    config: {
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
  const files = rsbuild.getDistFiles();
  const appleIcon = findFile(files, 'static/image/icon.png');
  const largeIcon = findFile(files, 'static/image/image.png');

  expect(appleIcon.endsWith('static/image/icon.png')).toBeTruthy();
  expect(largeIcon.endsWith('static/image/image.png')).toBeTruthy();

  const manifestPath = findFile(files, 'manifest.webmanifest');
  const html = getFileContent(files, 'index.html');

  expect(html).toContain(
    '<link href="https://example.com/static/image/icon.png" rel="apple-touch-icon" sizes="180x180">',
  );
  expect(html).toContain(
    '<link href="https://example.com/manifest.webmanifest" rel="manifest">',
  );

  expect(JSON.parse(files[manifestPath])).toEqual({
    name: 'My Website',
    icons: [
      {
        src: 'https://example.com/static/image/icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: 'https://example.com/static/image/image.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  });
});

test('should apply asset prefix to apple-touch-icon URL', async ({ build }) => {
  const rsbuild = await build({
    config: {
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
  const files = rsbuild.getDistFiles();

  const {
    origin: { bundlerConfigs },
  } = await rsbuild.instance.inspectConfig();

  expect(bundlerConfigs[0].output?.publicPath).toBe('https://www.example.com/');

  const html = getFileContent(files, 'index.html');

  expect(html).toContain(
    '<link href="https://www.example.com/static/image/icon.png" rel="apple-touch-icon" sizes="180x180">',
  );
});
