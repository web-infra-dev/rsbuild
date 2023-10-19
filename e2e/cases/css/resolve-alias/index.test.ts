import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should compile CSS with alias correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      source: {
        alias: {
          '@common': path.resolve(__dirname, 'src/common'),
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  if (rsbuild.providerType === 'rspack') {
    expect(content).toEqual(
      '.the-a-class{color:red}.the-a-class,.the-b-class{background-image:url(/static/image/icon.c6be40ea.png)}.the-b-class{color:blue}.the-c-class{background-image:url(/static/image/icon.c6be40ea.png);color:#ff0}',
    );
  } else {
    expect(content).toEqual(
      '.the-a-class{color:red}.the-a-class,.the-b-class{background-image:url(/static/image/icon.6c12aba3.png)}.the-b-class{color:blue}.the-c-class{background-image:url(/static/image/icon.6c12aba3.png);color:#ff0}',
    );
  }
});
