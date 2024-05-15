import { build, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginRem } from '@rsbuild/plugin-rem';

const fixtures = __dirname;

test('should convert rem unit correctly', async ({ page }) => {
  // convert to rem
  const rsbuild = await build({
    cwd: fixtures,
    runServer: true,
    plugins: [pluginReact(), pluginRem()],
  });

  await gotoPage(page, rsbuild);

  const root = page.locator('html');
  await expect(root).toHaveCSS('font-size', '64px');

  // less convert pxToRem
  const title = page.locator('#title');
  await expect(title).toHaveCSS('font-size', '25.6px');

  // scss convert pxToRem
  const header = page.locator('#header');
  await expect(header).toHaveCSS('font-size', '25.6px');

  // css convert pxToRem
  const description = page.locator('#description');
  await expect(description).toHaveCSS('font-size', '20.48px');

  await rsbuild.close();
});

test('should inline runtime code to html by default', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginReact(), pluginRem()],
  });
  const files = await rsbuild.unwrapOutputJSON();
  const htmlFile = Object.keys(files).find((file) => file.endsWith('.html'));

  expect(htmlFile).toBeTruthy();
  expect(files[htmlFile!].includes('function setRootPixel')).toBeTruthy();
});

test('should extract runtime code when inlineRuntime is false', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [
      pluginReact(),
      pluginRem({
        inlineRuntime: false,
      }),
    ],
  });
  const files = await rsbuild.unwrapOutputJSON();

  const htmlFile = Object.keys(files).find((file) => file.endsWith('.html'));
  const remFile = Object.keys(files).find(
    (file) => file.includes('/convert-rem') && file.endsWith('.js'),
  );

  expect(htmlFile).toBeTruthy();
  expect(remFile).toBeTruthy();
  expect(files[htmlFile!].includes('function setRootPixel')).toBeFalsy();
});

test('should apply crossorigin to rem runtime script', async ({ page }) => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [
      pluginReact(),
      pluginRem({
        inlineRuntime: false,
      }),
    ],
    runServer: true,
    rsbuildConfig: {
      html: {
        crossorigin: 'use-credentials',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const htmlFile = Object.keys(files).find((file) => file.endsWith('.html'));

  expect(htmlFile).toBeTruthy();
  expect(files[htmlFile!]).toMatch(
    /<script src="\/static\/js\/convert-rem.\d+\.\d+\.\d+(?:-(beta|alpha|rc)\.\d+)?.js" defer="" crossorigin="use-credentials">/,
  );
  expect(files[htmlFile!].includes('function setRootPixel')).toBeFalsy();

  await gotoPage(page, rsbuild);
  const root = page.locator('html');
  await expect(root).toHaveCSS('font-size', '64px');
  const description = page.locator('#description');
  await expect(description).toHaveCSS('font-size', '20.48px');

  await rsbuild.close();
});

test('should apply html.scriptLoading to rem runtime script', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [
      pluginReact(),
      pluginRem({
        inlineRuntime: false,
      }),
    ],
    runServer: true,
    rsbuildConfig: {
      html: {
        scriptLoading: 'module',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const htmlFile = Object.keys(files).find((file) => file.endsWith('.html'));

  expect(htmlFile).toBeTruthy();
  expect(files[htmlFile!]).toMatch(
    /<script type="module" src="\/static\/js\/convert-rem.\d+\.\d+\.\d+(?:-(beta|alpha|rc)\.\d+)?.js">/,
  );
  expect(files[htmlFile!].includes('function setRootPixel')).toBeFalsy();

  await gotoPage(page, rsbuild);
  const root = page.locator('html');
  await expect(root).toHaveCSS('font-size', '64px');
  const description = page.locator('#description');
  await expect(description).toHaveCSS('font-size', '20.48px');

  await rsbuild.close();
});
