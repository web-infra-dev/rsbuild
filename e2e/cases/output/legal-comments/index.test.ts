import { expect, rspackTest, test } from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';

rspackTest('legalComments linked (default)', async ({ page, buildPreview }) => {
  const rsbuild = await buildPreview({
    plugins: [pluginReact()],
    rsbuildConfig: {
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
  });

  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild!');

  const files = rsbuild.getDistFiles();

  const LicenseContent =
    files[
      Object.keys(files).find(
        (file) => file.includes('js/index') && file.endsWith('.LICENSE.txt'),
      )!
    ];

  expect(LicenseContent.includes('@preserve AAAA')).toBeTruthy();
  expect(LicenseContent.includes('@license BBB')).toBeTruthy();
  expect(LicenseContent.includes('Legal Comment CCC')).toBeTruthy();
  expect(LicenseContent.includes('Foo Bar')).toBeFalsy();

  const JsContent =
    files[
      Object.keys(files).find(
        (file) => file.includes('js/index') && file.endsWith('.js'),
      )!
    ];

  expect(JsContent.includes('Foo Bar')).toBeFalsy();
});

test('should omit legal comments when legalComments is set to "none"', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
    plugins: [pluginReact()],
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

  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild!');

  const files = rsbuild.getDistFiles();

  const LicenseFile = Object.keys(files).find(
    (file) => file.includes('js/index') && file.endsWith('.LICENSE.txt'),
  )!;

  expect(LicenseFile).toBeUndefined();

  const JsContent =
    files[
      Object.keys(files).find(
        (file) => file.includes('js/index') && file.endsWith('.js'),
      )!
    ];

  expect(JsContent.includes('@license BBB')).toBeFalsy();
});

test('should inline legal comments when legalComments is set to "inline"', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
    plugins: [pluginReact()],
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

  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild!');

  const files = rsbuild.getDistFiles();

  const LicenseFile = Object.keys(files).find(
    (file) => file.includes('js/index') && file.endsWith('.LICENSE.txt'),
  )!;

  expect(LicenseFile).toBeUndefined();

  const JsContent =
    files[
      Object.keys(files).find(
        (file) => file.includes('js/index') && file.endsWith('.js'),
      )!
    ];

  expect(JsContent.includes('@license BBB')).toBeTruthy();
  expect(JsContent.includes('Foo Bar')).toBeFalsy();
});
