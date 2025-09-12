import { expect, test } from '@e2e/helper';

test('should build successfully with multiple environments', async ({
  page,
  build,
}) => {
  const rsbuild = await build({
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
});

test('should serve successfully in dev with multiple environments', async ({
  page,
  dev,
}) => {
  await dev({
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
});
