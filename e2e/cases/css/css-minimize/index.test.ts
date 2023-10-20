import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should minimize CSS correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    rsbuildConfig: {},
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toEqual(
    '.a,.b{font-size:1.5rem;line-height:1.5;text-align:center}.b{background:#fafafa}',
  );
});
