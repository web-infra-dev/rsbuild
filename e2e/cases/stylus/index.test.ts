import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

import { pluginStylus } from '@rsbuild/plugin-stylus';

test('should compile stylus correctly', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    plugins: [pluginStylus()],
  });
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  if (builder.providerType === 'rspack') {
    expect(content).toEqual(
      'body{color:red;font:14px Arial,sans-serif}.title-class-_7352f{font-size:14px}',
    );
  } else {
    expect(content).toEqual(
      'body{color:red;font:14px Arial,sans-serif}.title-class-XQprme{font-size:14px}',
    );
  }
});
