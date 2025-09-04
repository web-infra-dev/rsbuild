import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    decoratorTest: {
      className: string;
      logged: string[];
    };
  }
}

test('should compile decorators correctly in development mode', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  // Test class decorator
  expect(await page.evaluate(() => window.decoratorTest.className)).toBe(
    'TestService',
  );

  // Test method decorators (should log method calls)
  expect(await page.evaluate(() => window.decoratorTest.logged)).toEqual([
    'testMethod called',
    'anotherMethod called',
  ]);

  await rsbuild.close();
});

test('should compile decorators correctly in production mode', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  // Test class decorator
  expect(await page.evaluate(() => window.decoratorTest.className)).toBe(
    'TestService',
  );

  // Test method decorators (should log method calls)
  expect(await page.evaluate(() => window.decoratorTest.logged)).toEqual([
    'testMethod called',
    'anotherMethod called',
  ]);

  await rsbuild.close();
});
