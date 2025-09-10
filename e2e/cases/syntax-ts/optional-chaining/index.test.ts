import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should compile optional chaining and nullish coalescing in dev', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate(() => window.optionalChainingTest)).toBe(
    'john@example.com',
  );
  expect(await page.evaluate(() => window.nullishCoalescingTest)).toBe(
    'No email, fallback',
  );

  await rsbuild.close();
});

test('should compile optional chaining and nullish coalescing in build', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate(() => window.optionalChainingTest)).toBe(
    'john@example.com',
  );
  expect(await page.evaluate(() => window.nullishCoalescingTest)).toBe(
    'No email, fallback',
  );

  await rsbuild.close();
});
