import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

const fixtures = __dirname;

test('legalComments linked (default)', async ({ page }) => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.jsx'),
    },
    runServer: true,
    rsbuildConfig: {
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild!');

  const files = await rsbuild.unwrapOutputJSON();

  const LicenseContent =
    files[
      Object.keys(files).find(
        (file) => file.includes('js/main') && file.endsWith('.LICENSE.txt'),
      )!
    ];

  expect(LicenseContent.includes('@preserve AAAA')).toBeTruthy();
  expect(LicenseContent.includes('@license BBB')).toBeTruthy();
  expect(LicenseContent.includes('Legal Comment CCC')).toBeTruthy();
  expect(LicenseContent.includes('Foo Bar')).toBeFalsy();

  const JsContent =
    files[
      Object.keys(files).find(
        (file) => file.includes('js/main') && file.endsWith('.js'),
      )!
    ];

  expect(JsContent.includes('Foo Bar')).toBeFalsy();

  rsbuild.close();
});

test('legalComments none', async ({ page }) => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.jsx'),
    },
    runServer: true,
    rsbuildConfig: {
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
      output: {
        legalComments: 'none',
      },
    },
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild!');

  const files = await rsbuild.unwrapOutputJSON();

  const LicenseFile = Object.keys(files).find(
    (file) => file.includes('js/main') && file.endsWith('.LICENSE.txt'),
  )!;

  expect(LicenseFile).toBeUndefined();

  const JsContent =
    files[
      Object.keys(files).find(
        (file) => file.includes('js/main') && file.endsWith('.js'),
      )!
    ];

  expect(JsContent.includes('@license BBB')).toBeFalsy();

  rsbuild.close();
});

test('legalComments inline', async ({ page }) => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.jsx'),
    },
    runServer: true,
    rsbuildConfig: {
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
      output: {
        legalComments: 'inline',
      },
    },
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild!');

  const files = await rsbuild.unwrapOutputJSON();

  const LicenseFile = Object.keys(files).find(
    (file) => file.includes('js/main') && file.endsWith('.LICENSE.txt'),
  )!;

  expect(LicenseFile).toBeUndefined();

  const JsContent =
    files[
      Object.keys(files).find(
        (file) => file.includes('js/main') && file.endsWith('.js'),
      )!
    ];

  expect(JsContent.includes('@license BBB')).toBeTruthy();
  expect(JsContent.includes('Foo Bar')).toBeFalsy();

  rsbuild.close();
});
