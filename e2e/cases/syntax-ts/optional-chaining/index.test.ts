import { expect, test } from '@e2e/helper';

test('should compile optional chaining and nullish coalescing in dev', async ({
  page,
  dev,
}) => {
  await dev();

  expect(await page.evaluate(() => window.optionalChainingTest)).toBe(
    'john@example.com',
  );
  expect(await page.evaluate(() => window.nullishCoalescingTest)).toBe(
    'No email, fallback',
  );
});

test('should compile optional chaining and nullish coalescing in build', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();

  expect(await page.evaluate(() => window.optionalChainingTest)).toBe(
    'john@example.com',
  );
  expect(await page.evaluate(() => window.nullishCoalescingTest)).toBe(
    'No email, fallback',
  );
});
