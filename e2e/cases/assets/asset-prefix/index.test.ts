import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow dev.assetPrefix to be `auto`', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      dev: {
        assetPrefix: 'auto',
      },
    },
  });

  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('auto');

  const testEl2 = page.locator('#test2');
  await expect(testEl2).toHaveText('auto');

  await rsbuild.close();
});

test('should allow dev.assetPrefix to be true', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      dev: {
        assetPrefix: true,
      },
    },
  });

  const testEl = page.locator('#test');
  await expect(testEl).toHaveText(`http://localhost:${rsbuild.port}`);
  await rsbuild.close();
});

test('should allow dev.assetPrefix to have <port> placeholder', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      dev: {
        assetPrefix: 'http://localhost:<port>/',
      },
    },
  });

  const testEl = page.locator('#test');
  await expect(testEl).toHaveText(`http://localhost:${rsbuild.port}`);

  const testEl2 = page.locator('#test2');
  await expect(testEl2).toHaveText(`http://localhost:${rsbuild.port}`);

  await rsbuild.close();
});

test('should allow output.assetPrefix to be `auto`', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      output: {
        assetPrefix: 'auto',
      },
    },
  });

  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('auto');
  await rsbuild.close();
});

test('should inject assetPrefix to env var and template correctly', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      html: {
        template: './src/template.html',
      },
      output: {
        assetPrefix: 'http://example.com',
        inlineScripts: true,
      },
    },
  });

  await expect(page.locator('#prefix1')).toHaveText('http://example.com');
  await expect(page.locator('#prefix2')).toHaveText('http://example.com');
  await rsbuild.close();
});

test('should use output.assetPrefix in none mode', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      mode: 'none',
      dev: {
        assetPrefix: 'http://dev.com',
      },
      output: {
        assetPrefix: 'http://prod.com',
      },
    },
  });

  const files = await rsbuild.getDistFiles();
  const indexHtml =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  expect(indexHtml).toContain('http://prod.com');
  expect(indexHtml).not.toContain('http://dev.com');
});
