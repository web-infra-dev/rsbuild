import { resolve } from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = resolve(__dirname);

test('should inject styles and not emit CSS files when output.injectStyles is true', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: fixtures,
    page,
    plugins: [pluginReact()],
    rsbuildConfig: {
      output: {
        injectStyles: true,
      },
    },
  });

  // injectStyles worked
  const files = rsbuild.getDistFiles();
  const cssFiles = Object.keys(files).filter((file) => file.endsWith('.css'));

  expect(cssFiles.length).toBe(0);

  // scss worked
  const header = page.locator('#header');
  await expect(header).toHaveCSS('font-size', '20px');

  // less worked
  const title = page.locator('#title');
  await expect(title).toHaveCSS('font-size', '20px');

  await rsbuild.close();
});
