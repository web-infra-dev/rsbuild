import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
import { globContentJSON } from '@scripts/helper';

test('should allow to generate HTML with filename hash', async () => {
  await build({
    cwd: __dirname,
    rsbuildConfig: {
      tools: {
        htmlPlugin(config, { entryName }) {
          config.filename = `${entryName}.[contenthash:8].html`;
          return config;
        },
      },
    },
  });

  const outputs = await globContentJSON(join(__dirname, 'dist'));
  const htmlFilename = Object.keys(outputs).find((item) =>
    item.endsWith('.html'),
  );

  expect(/index.\w+.html/.test(htmlFilename!)).toBeTruthy();
});
