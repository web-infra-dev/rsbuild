import { join, resolve } from 'path';
import { test, expect } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginPug } from '@rsbuild/plugin-pug';

const fixtures = resolve(__dirname, '../');

test('pug', async ({ page }) => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
    runServer: true,
    plugins: [pluginReact(), pluginPug()],
    rsbuildConfig: {
      html: {
        template: './static/index.pug',
      },
    },
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const testPug = page.locator('#test-pug');
  await expect(testPug).toHaveText('Pug source code!');

  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});
