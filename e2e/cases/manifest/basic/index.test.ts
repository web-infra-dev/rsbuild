import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, getFileContent, rspackTest, test } from '@e2e/helper';

test('should generate manifest file in output', async ({ build }) => {
  const rsbuild = await build({
    config: {
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

  const manifestContent = getFileContent(files, 'manifest.json');

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

test('should generate manifest file at specified path', async ({ build }) => {
  await build({
    config: {
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

  const manifest = join(import.meta.dirname, 'dist', 'custom/my-manifest.json');
  const manifestContent = readFileSync(manifest, 'utf-8');
  expect(manifestContent).toBeDefined();

  const parsed = JSON.parse(manifestContent);

  // main.js, index.html
  expect(Object.keys(parsed.allFiles).length).toBe(2);
});

test('should generate manifest file when target is node', async ({ build }) => {
  const rsbuild = await build({
    config: {
      output: {
        distPath: 'dist-1',
        target: 'node',
        manifest: true,
        filenameHash: false,
      },
    },
  });

  const files = rsbuild.getDistFiles();

  const manifestContent = getFileContent(files, 'manifest.json');

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
    config: {
      output: {
        distPath: 'dist-dev',
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

  const manifestContent = getFileContent(files, 'manifest.json');

  expect(manifestContent).toBeDefined();
});

test('should allow to filter files in manifest', async ({ build }) => {
  const rsbuild = await build({
    config: {
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

  const manifestContent = getFileContent(files, 'manifest.json');
  const manifest = JSON.parse(manifestContent);

  // main.js
  expect(Object.keys(manifest.allFiles).length).toBe(1);

  expect(manifest.entries.index).toMatchObject({
    initial: {
      js: ['/static/js/index.js'],
    },
  });
});

rspackTest(
  'should allow to include license files in manifest',
  async ({ build }) => {
    const rsbuild = await build({
      config: {
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

    const manifestContent = getFileContent(files, 'manifest.json');
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
