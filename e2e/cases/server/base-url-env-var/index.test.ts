import test from 'node:test';
import { build, dev } from '@e2e/helper';
import { expect } from '@playwright/test';

// TODO: fix this test
test.skip('should define BASE_URL env var correctly in dev', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
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

  await rsbuild.close();
});

test.skip('should define BASE_URL env var correctly in build', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
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

  await rsbuild.close();
});
