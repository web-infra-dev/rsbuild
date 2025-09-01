import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should compile optional chaining and nullish coalescing correctly', async ({
  page,
}) => {
  await build({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate(() => window.optionalChainingTest)).toBe(
    'john@example.com',
  );
  expect(await page.evaluate(() => window.nullishCoalescingTest)).toBe(
    'No email, fallback',
  );
});
