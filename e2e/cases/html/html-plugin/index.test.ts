import { fse } from '@rsbuild/shared';
import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

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

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const pagePath = join(rsbuild.distPath, 'index.html');
  const content = await fse.readFile(pagePath, 'utf-8');

  const allScripts = /(<script [\s\S]*?>)/g.exec(content);

  expect(
    allScripts?.every((data) => data.includes('type="module"')),
  ).toBeTruthy();

  await rsbuild.close();
});
