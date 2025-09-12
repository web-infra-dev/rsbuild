import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, rspackOnlyTest, test } from '@e2e/helper';

test('should generate manifest file in output', async ({ buildOnly }) => {
  const rsbuild = await buildOnly({
    rsbuildConfig: {
      output: {
        manifest: true,
        filenameHash: false,
      },
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
  });

  const files = rsbuild.getDistFiles();

  const manifestContent =
    files[Object.keys(files).find((file) => file.endsWith('manifest.json'))!];

  expect(manifestContent).toBeDefined();

  const manifest = JSON.parse(manifestContent);

  // main.js, index.html
  expect(Object.keys(manifest.allFiles).length).toBe(2);

  expect(manifest.entries.index).toMatchObject({
    initial: {
      js: ['/static/js/index.js'],
    },
    html: ['/index.html'],
  });
});

test('should generate manifest file at specified path', async ({
  buildOnly,
}) => {
  await buildOnly({
    rsbuildConfig: {
      output: {
        manifest: './custom/my-manifest.json',
        filenameHash: false,
      },
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
  });

  const manifest = join(__dirname, 'dist', 'custom/my-manifest.json');
  const manifestContent = readFileSync(manifest, 'utf-8');
  expect(manifestContent).toBeDefined();

  const parsed = JSON.parse(manifestContent);

  // main.js, index.html
  expect(Object.keys(parsed.allFiles).length).toBe(2);
});

test('should generate manifest file when target is node', async ({
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-1',
        },
        target: 'node',
        manifest: true,
        filenameHash: false,
      },
    },
  });

  const files = rsbuild.getDistFiles();

  const manifestContent =
    files[Object.keys(files).find((file) => file.endsWith('manifest.json'))!];

  expect(manifestContent).toBeDefined();

  const manifest = JSON.parse(manifestContent);

  // main.js, index.html
  expect(Object.keys(manifest.allFiles).length).toBe(1);

  expect(manifest.entries.index).toMatchObject({
    initial: {
      js: ['/index.js'],
    },
  });
});

test('should always write manifest to disk when in dev', async ({ dev }) => {
  const rsbuild = await dev({
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-dev',
        },
        manifest: true,
        filenameHash: false,
      },
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
  });

  const files = rsbuild.getDistFiles();

  const manifestContent =
    files[Object.keys(files).find((file) => file.endsWith('manifest.json'))!];

  expect(manifestContent).toBeDefined();
});

test('should allow to filter files in manifest', async ({ buildOnly }) => {
  const rsbuild = await buildOnly({
    rsbuildConfig: {
      output: {
        manifest: {
          filter: (file) => file.name.endsWith('.js'),
        },
        filenameHash: false,
      },
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
  });

  const files = rsbuild.getDistFiles();

  const manifestContent =
    files[Object.keys(files).find((file) => file.endsWith('manifest.json'))!];
  const manifest = JSON.parse(manifestContent);

  // main.js
  expect(Object.keys(manifest.allFiles).length).toBe(1);

  expect(manifest.entries.index).toMatchObject({
    initial: {
      js: ['/static/js/index.js'],
    },
  });
});

rspackOnlyTest(
  'should allow to include license files in manifest',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly({
      rsbuildConfig: {
        output: {
          manifest: {
            filter: () => true,
          },
          filenameHash: false,
        },
        performance: {
          chunkSplit: {
            strategy: 'all-in-one',
          },
        },
      },
    });

    const files = rsbuild.getDistFiles();

    const manifestContent =
      files[Object.keys(files).find((file) => file.endsWith('manifest.json'))!];
    const manifest = JSON.parse(manifestContent);

    expect(Object.keys(manifest.allFiles).length).toBe(3);

    expect(manifest.entries.index).toMatchObject({
      initial: {
        js: ['/static/js/index.js'],
      },
      html: ['/index.html'],
      assets: ['/static/js/index.js.LICENSE.txt'],
    });
  },
);
