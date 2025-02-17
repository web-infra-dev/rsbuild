import { build, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

rspackOnlyTest('should apply defer by default', async () => {
  const rsbuild = await build({
    cwd: import.meta.dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain('<script defer src="');
});

test('should remove defer when scriptLoading is "blocking"', async () => {
  const rsbuild = await build({
    cwd: import.meta.dirname,
    rsbuildConfig: {
      html: {
        scriptLoading: 'blocking',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain('<script src="');
});

test('should allow to set scriptLoading to "module"', async () => {
  const rsbuild = await build({
    cwd: import.meta.dirname,
    rsbuildConfig: {
      html: {
        scriptLoading: 'module',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain('<script type="module" src="');
});
