import { expect, test } from '@e2e/helper';

test('should not apply crossOrigin by default', async ({ buildOnly }) => {
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

  expect(html).not.toContain('crossorigin');
});

test('should apply crossOrigin when crossorigin is "anonymous" and not same origin', async ({
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    rsbuildConfig: {
      html: {
        scriptLoading: 'blocking',
        crossorigin: 'anonymous',
      },
      output: {
        assetPrefix: '//aaaa.com',
      },
    },
  });
  const files = rsbuild.getDistFiles();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain('crossorigin="anonymous"></script>');
});
