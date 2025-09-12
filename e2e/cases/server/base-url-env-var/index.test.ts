import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should define BASE_URL env var correctly in dev',
  async ({ page, dev }) => {
    await dev({
      rsbuildConfig: {
        html: {
          template: './src/index.html',
        },
        server: {
          base: '/base',
        },
      },
    });

    // should define `process.env.BASE_URL` correctly
    await expect(page.locator('#public-base-path-process')).toHaveText('/base');

    // should define `import.meta.env.BASE_URL` correctly
    await expect(page.locator('#public-base-path-meta')).toHaveText('/base');
  },
);

rspackOnlyTest(
  'should define BASE_URL env var correctly in build',
  async ({ page, build }) => {
    const rsbuild = await build({
      rsbuildConfig: {
        html: {
          template: './src/index.html',
        },
        server: {
          base: '/base',
        },
      },
    });

    // should define `process.env.BASE_URL` correctly
    await expect(page.locator('#public-base-path-process')).toHaveText('/base');

    // should define `import.meta.env.BASE_URL` correctly
    await expect(page.locator('#public-base-path-meta')).toHaveText('/base');
  },
);
