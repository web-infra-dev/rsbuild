import { build, expect, test } from '@e2e/helper';

test('should build a web worker in build using the new Worker syntax', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  await expect(page.locator('#root')).toHaveText(
    'The Answer to the Ultimate Question of Life, The Universe, and Everything: 42',
  );

  await rsbuild.close();
});

test('should build a web worker in dev using the new Worker syntax', async ({
  page,
  dev,
}) => {
  await dev();

  await expect(page.locator('#root')).toHaveText(
    'The Answer to the Ultimate Question of Life, The Universe, and Everything: 42',
  );
});
