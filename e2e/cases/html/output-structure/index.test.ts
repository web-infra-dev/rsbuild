import fs from 'node:fs';
import { join } from 'node:path';
import { build, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('html.outputStructure', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      html: {
        outputStructure: 'nested',
      },
    },
  });

  await gotoPage(page, rsbuild);

  const pagePath = join(rsbuild.distPath, 'index/index.html');

  expect(fs.existsSync(pagePath)).toBeTruthy();

  await rsbuild.close();
});
