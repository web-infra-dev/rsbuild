import { dev, expect, gotoPage, test } from '@e2e/helper';

test('should allow to define global variables in development', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  await gotoPage(page, rsbuild);

  const testEl = page.locator('#test-el');
  await expect(testEl).toHaveText('aaaaa');
});

test('should allow to define global variables in production build', async ({
  page,
  build,
}) => {
  const rsbuild = await build();

  await gotoPage(page, rsbuild);

  const testEl = page.locator('#test-el');
  await expect(testEl).toHaveText('aaaaa');
});

test('should warn when define `process.env`', async ({ build }) => {
  const rsbuild = await build({
    rsbuildConfig: {
      source: {
        define: {
          'process.env': process.env,
        },
      },
    },
  });

  await rsbuild.expectLog('The "source.define" option includes an object');
});

test('should warn when define stringified `process.env`', async ({ build }) => {
  const rsbuild = await build({
    rsbuildConfig: {
      source: {
        define: {
          'process.env': JSON.stringify(process.env),
        },
      },
    },
  });

  await rsbuild.expectLog('The "source.define" option includes an object');
});
