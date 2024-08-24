import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('multi compiler build', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      environments: {
        web: {
          output: {
            target: 'web',
          },
        },
        node: {
          output: {
            target: 'node',
          },
        },
      },
    },
  });

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});

test('multi compiler dev', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-dev',
        },
      },
      environments: {
        web: {
          output: {
            target: 'web',
          },
        },
        node: {
          output: {
            target: 'node',
          },
        },
      },
    },
  });

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});
