import { expect, test } from '@playwright/test';
import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { getPolyfillContent } from '../helper';

const EXPECT_VALUE = {
  '1': [
    { type: '1', value: 1 },
    { type: '1', value: 2 },
  ],
  '2': [{ type: '2', value: 3 }],
};

test('should add polyfill when set polyfill entry (default)', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        polyfill: 'entry',
        sourceMap: {
          js: 'source-map',
        },
      },
    },
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  expect(await page.evaluate('window.a')).toEqual(EXPECT_VALUE);

  await rsbuild.close();

  const files = await rsbuild.unwrapOutputJSON(false);

  const content = getPolyfillContent(files);

  // should polyfill all api
  expect(content.includes('object.group-by.js')).toBeTruthy();
  expect(content.includes('object.has-own.js')).toBeTruthy();
});

// @rsbuild/plugin-swc do not support groupBy yet
rspackOnlyTest(
  'should add polyfill when set polyfill usage',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      rsbuildConfig: {
        output: {
          polyfill: 'usage',
          sourceMap: {
            js: 'source-map',
          },
        },
      },
      runServer: true,
    });

    page.on('pageerror', (err) => {
      console.log('page err', err);
    });

    await gotoPage(page, rsbuild);

    expect(await page.evaluate('window.a')).toEqual(EXPECT_VALUE);

    await rsbuild.close();

    const files = await rsbuild.unwrapOutputJSON(false);

    const content = getPolyfillContent(files);

    // should only polyfill some usage api
    expect(content.includes('object.group-by.js')).toBeTruthy();
    expect(content.includes('object.has-own.js')).toBeFalsy();
  },
);
