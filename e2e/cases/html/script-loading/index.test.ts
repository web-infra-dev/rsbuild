import { expect, rspackOnlyTest, test } from '@e2e/helper';

rspackOnlyTest('should apply defer by default', async ({ buildOnly }) => {
  const rsbuild = await buildOnly();
  const files = rsbuild.getDistFiles();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain('<script defer src="');
});

test('should remove defer when scriptLoading is "blocking"', async ({
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    rsbuildConfig: {
      html: {
        scriptLoading: 'blocking',
      },
    },
  });
  const files = rsbuild.getDistFiles();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain('<script src="');
});

test('should allow to set scriptLoading to "module"', async ({ buildOnly }) => {
  const rsbuild = await buildOnly({
    rsbuildConfig: {
      html: {
        scriptLoading: 'module',
      },
    },
  });
  const files = rsbuild.getDistFiles();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain('<script type="module" src="');
});
