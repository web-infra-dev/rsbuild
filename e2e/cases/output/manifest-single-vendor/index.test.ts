import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const fixtures = __dirname;

test('should generate manifest with single vendor as expected', async () => {
  const rsbuild = await build({
    cwd: fixtures,
  });

  const files = await rsbuild.unwrapOutputJSON();

  const manifestContent =
    files[Object.keys(files).find((file) => file.endsWith('manifest.json'))!];

  expect(manifestContent).toBeDefined();

  const manifest = JSON.parse(manifestContent);

  expect(Object.keys(manifest.allFiles).length).toBe(3);

  expect(manifest.entries.index).toMatchObject({
    html: ['/index.html'],
    initial: {
      js: ['/static/js/vendor.js', '/static/js/index.js'],
    },
  });
});
