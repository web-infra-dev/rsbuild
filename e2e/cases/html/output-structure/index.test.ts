import fs from 'fs';
import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, gotoPage } from '@scripts/shared';

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
