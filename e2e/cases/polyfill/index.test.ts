import path from 'path';
import { expect, test } from '@playwright/test';
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
    rsbuildConfig: {
      output: {
        polyfill: 'entry',
      },
    },
    runServer: true,
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  expect(await page.evaluate('window.a')).toEqual(EXPECT_VALUE);

  await rsbuild.close();

  const files = await rsbuild.unwrapOutputJSON(false);

  const content = getPolyfillContent(files);

  // should polyfill all api
  expect(content.includes('object.group-by.js')).toBeTruthy();
  expect(content.includes('object.has-own.js')).toBeTruthy();
});

test('should add polyfill when set polyfill usage', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        polyfill: 'usage',
      },
    },
    runServer: true,
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  expect(await page.evaluate('window.a')).toEqual(EXPECT_VALUE);

  await rsbuild.close();

  const files = await rsbuild.unwrapOutputJSON(false);

  const content = getPolyfillContent(files);

  // should only polyfill some usage api
  expect(content.includes('object.group-by.js')).toBeTruthy();
  expect(content.includes('object.has-own.js')).toBeFalsy();
});
