import { expect, test } from '@e2e/helper';
import { findFile, getFileContent } from '@rstackjs/test-utils';

test.for(['/', 'auto'])(
  'should load CSS `?url` assets with assetPrefix=%s',
  async (assetPrefix, { page, runBothServe }) => {
    await runBothServe(
      async () => {
        await page.waitForFunction('window.imageWidth > 0');
      },
      {
        config: {
          dev: { assetPrefix },
          output: { assetPrefix },
        },
      },
    );
  },
);

test.for([
  ['../', '../'],
  [
    'https://cdn.example.com/my assets/',
    'https://cdn.example.com/my%20assets/',
  ],
  ['https://cdn.example.com/prefix-', 'https://cdn.example.com/prefix-'],
  [(): string => 'https://cdn.example.com/', 'https://cdn.example.com/'],
  [(): string => '../', '../'],
] as const)(
  'should preserve CSS `?url` publicPath %s',
  async ([publicPath, expected], { build }) => {
    const rsbuild = await build({
      config: {
        output: { filenameHash: false },
        tools: { rspack: { output: { publicPath } } },
      },
    });
    const css = getFileContent(
      rsbuild.getDistFiles(),
      'static/css/nested/style.css',
    );
    expect(css).toContain(`url(${expected}static/image/image.png)`);
  },
);

test('should update CSS `?url` hashes when the public path changes', async ({
  build,
}) => {
  const filenames: string[] = [];
  for (const assetPrefix of ['/a/', '/b/']) {
    const rsbuild = await build({
      config: {
        output: { assetPrefix },
        tools: { rspack: { optimization: { realContentHash: false } } },
      },
    });
    filenames.push(
      findFile(rsbuild.getDistFiles(), /style\.[a-f0-9]+\.css$/, {
        ignoreHash: false,
      }),
    );
  }
  expect(filenames[0]).not.toBe(filenames[1]);
});
