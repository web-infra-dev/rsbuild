import path from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import { pluginReact } from '@rsbuild/plugin-react';

test('should add node-polyfill when add node-polyfill plugin', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    plugins: [pluginNodePolyfill(), pluginReact()],
    runServer: true,
  });
  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  const testBuffer = page.locator('#test-buffer');
  await expect(testBuffer).toHaveText('120120120120');

  const testQueryString = page.locator('#test-querystring');
  await expect(testQueryString).toHaveText('foo=bar');

  await rsbuild.close();
});
