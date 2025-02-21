import fs from 'node:fs';
import { join } from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('html.outputStructure', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      html: {
        outputStructure: 'nested',
      },
    },
  });

  const pagePath = join(rsbuild.distPath, 'index/index.html');

  expect(fs.existsSync(pagePath)).toBeTruthy();

  await rsbuild.close();
});
