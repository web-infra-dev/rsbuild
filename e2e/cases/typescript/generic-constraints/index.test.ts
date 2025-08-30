import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should compile TypeScript generic constraints correctly', async ({
  page,
}) => {
  await build({
    cwd: __dirname,
    page,
  });

  // Test generic function with extends constraint
  expect(await page.evaluate(() => window.testResults.getByIdResult)).toBe(
    'Bob-Laptop',
  );

  // Test generic function with keyof constraint
  expect(await page.evaluate(() => window.testResults.getPropertyResult)).toBe(
    'Alice-999',
  );

  // Test generic class with constraint
  const collectionResult = await page.evaluate(
    () => window.testResults.collectionResult,
  );
  expect(collectionResult.findResult).toBe('Diana');
  expect(collectionResult.allIds).toEqual(['3', '4']);

  // Test utility type with complex constraint
  expect(await page.evaluate(() => window.testResults.updateResult)).toBe(
    'Eve-33',
  );
});
