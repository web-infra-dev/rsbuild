import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

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

test('should build a web worker in dev mode using the new Worker syntax', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  await expect(page.locator('#root')).toHaveText(
    'The Answer to the Ultimate Question of Life, The Universe, and Everything: 42',
  );

  await rsbuild.close();
});
