import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should not apply crossOrigin by default', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      html: {
        scriptLoading: 'blocking',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).not.toContain('crossorigin');
});

test('should not apply crossOrigin when same origin', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      html: {
        scriptLoading: 'blocking',
        crossorigin: 'anonymous',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).not.toContain('crossorigin');
});

test('should apply crossOrigin when crossorigin is "anonymous" and not same origin', async () => {
  const rsbuild = await build({
    cwd: __dirname,
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
  const files = await rsbuild.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain('crossorigin="anonymous"></script>');
});
