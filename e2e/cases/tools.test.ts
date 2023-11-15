import { join } from 'path';
import { expect, test } from '@playwright/test';
import { webpackOnlyTest } from '@scripts/helper';
import { build, getHrefByEntryName } from '../scripts/shared';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

test('postcss plugins overwrite', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'output/rem'),
    runServer: true,
    plugins: [pluginReact()],
    rsbuildConfig: {
      source: {
        entries: {
          index: join(fixtures, 'output/rem/src/index.ts'),
        },
      },
      tools: {
        postcss: {
          postcssOptions: {
            plugins: [],
          },
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const title = page.locator('#title');
  await expect(title).toHaveText('title');

  await rsbuild.close();
});

test('bundlerChain - set alias config', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'source/basic'),
    runServer: true,
    rsbuildConfig: {
      source: {
        entries: {
          index: join(fixtures, 'source/basic/src/index.js'),
        },
      },
      tools: {
        bundlerChain: (chain) => {
          chain.resolve.alias.merge({
            '@common': join(fixtures, 'source/basic/src/common'),
          });
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));
  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild! 1');

  await rsbuild.close();
});

// Rspack do not support publicPath function yet
webpackOnlyTest('bundlerChain - custom publicPath function', async () => {
  const rsbuild = await build({
    cwd: join(fixtures, 'output/rem'),
    plugins: [pluginReact()],
    rsbuildConfig: {
      source: {
        entries: {
          index: join(fixtures, 'output/rem/src/index.ts'),
        },
      },
      output: {
        disableFilenameHash: true,
      },
      tools: {
        bundlerChain: (chain) => {
          chain.output.publicPath(() => 'https://www.foo.com/');
        },
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();

  const htmlFile = Object.keys(files).find((file) => file.endsWith('.html'));
  expect(htmlFile).toBeTruthy();

  const htmlContent = files[htmlFile!];
  expect(htmlContent).toContain(
    `script defer="defer" src="https://www.foo.com/static/js/index.js"></script>`,
  );
  expect(htmlContent).toContain(
    `<link href="https://www.foo.com/static/css/index.css" rel="stylesheet">`,
  );
});
