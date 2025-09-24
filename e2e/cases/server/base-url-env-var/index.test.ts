import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should define BASE_URL env var correctly in dev',
  async ({ page, dev }) => {
    await dev({
      config: {
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

rspackTest(
  'should define BASE_URL env var correctly in build',
  async ({ page, buildPreview }) => {
    await buildPreview({
      config: {
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
