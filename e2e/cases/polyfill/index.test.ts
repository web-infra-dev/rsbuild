import path from 'path';
import { expect, test } from '@playwright/test';
import { webpackOnlyTest } from '@scripts/helper';
import { build, getHrefByEntryName } from '@scripts/shared';

const POLYFILL_RE = /\/lib-polyfill/;

const EXPECT_VALUE = {
  '1': [
    { type: '1', value: 1 },
    { type: '1', value: 2 },
  ],
  '2': [{ type: '2', value: 3 }],
};

const getPolyfillContent = (files: Record<string, string>) => {
  const polyfillFileName = Object.keys(files).find(
    (file) => POLYFILL_RE.test(file) && file.endsWith('.js.map'),
  );

  const indexFileName = Object.keys(files).find(
    (file) => file.includes('index') && file.endsWith('.js.map'),
  )!;

  const content = polyfillFileName
    ? files[polyfillFileName]
    : files[indexFileName];
  return content;
};

test('should add polyfill when set polyfill entry (default)', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    rsbuildConfig: {
      output: {
        polyfill: 'entry',
      },
    },
    runServer: true,
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  expect(await page.evaluate('window.a')).toEqual(EXPECT_VALUE);

  rsbuild.close();

  const files = await rsbuild.unwrapOutputJSON(false);

  const content = getPolyfillContent(files);

  // should polyfill all api
  expect(content.includes('object.group-by.js')).toBeTruthy();
});

// TODO: needs builtin:swc-loader
webpackOnlyTest(
  'should add polyfill when set polyfill usage',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
      rsbuildConfig: {
        output: {
          polyfill: 'usage',
        },
      },
      runServer: true,
    });

    await page.goto(getHrefByEntryName('index', rsbuild.port));

    expect(await page.evaluate('window.a')).toEqual(EXPECT_VALUE);

    rsbuild.close();

    const files = await rsbuild.unwrapOutputJSON(false);

    const content = getPolyfillContent(files);

    // should only polyfill some usage api
    expect(content.includes('object.group-by.js')).toBeTruthy();
    expect(content.includes('String.prototype.trimEnd')).toBeFalsy();
  },
);
