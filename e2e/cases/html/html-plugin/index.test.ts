import fs from 'node:fs';
import { join } from 'node:path';
import { build, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('tools.htmlPlugin', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      tools: {
        htmlPlugin(config, { entryName }) {
          if (entryName === 'index') {
            config.scriptLoading = 'module';
          }
        },
      },
    },
  });

  await gotoPage(page, rsbuild);

  const pagePath = join(rsbuild.distPath, 'index.html');
  const content = await fs.promises.readFile(pagePath, 'utf-8');

  const allScripts = /(<script [\s\S]*?>)/g.exec(content);

  expect(
    allScripts?.every((data) => data.includes('type="module"')),
  ).toBeTruthy();

  await rsbuild.close();
});
