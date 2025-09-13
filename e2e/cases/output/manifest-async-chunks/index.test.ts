import { expect, test } from '@e2e/helper';

test('should generate manifest for async chunks correctly', async ({
  build,
}) => {
  const rsbuild = await build({
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

  expect(Object.keys(manifest.allFiles).length).toBe(4);

  expect(manifest.entries.index).toMatchObject({
    html: ['/index.html'],
    initial: {
      js: ['/static/js/index.js'],
    },
    async: {
      js: ['/static/js/async/async-chunk.js'],
      css: ['/static/css/async/async-chunk.css'],
    },
  });
});
