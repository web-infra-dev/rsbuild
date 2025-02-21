import fs from 'node:fs';
import { join } from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('tools.htmlPlugin', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
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

  const pagePath = join(rsbuild.distPath, 'index.html');
  const content = await fs.promises.readFile(pagePath, 'utf-8');

  const allScripts = /(<script [\s\S]*?>)/g.exec(content);

  expect(
    allScripts?.every((data) => data.includes('type="module"')),
  ).toBeTruthy();

  await rsbuild.close();
});
