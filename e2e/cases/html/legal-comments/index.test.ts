import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';

test('should preserve legal comments in HTML by default', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  expect(html).toContain('@license test');
});

test('should remove legal comments in HTML when `output.legalComments` is `none`', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        legalComments: 'none',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  expect(html).not.toContain('@license test');
});
