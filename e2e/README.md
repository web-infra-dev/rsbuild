# @rsbuild/e2e

This folder contains the e2e test cases of Rsbuild.

## Tech stack

- [playwright](https://github.com/microsoft/playwright): The e2e test framework.

## Commands

Most of the E2E tests in Rsbuild are run by both Rspack and webpack at the same time. This is to check that the functionality of Rspack is correctly aligned with webpack.

```bash
# Run all test cases, including Rspack and webpack
pnpm test

# Run test cases for Rspack
pnpm test:rspack

# Run test cases for webpack
pnpm test:webpack

# Run specific test case, such as "css"
pnpm test:webpack css
pnpm test:rspack css
```

## Add test cases

Test cases added using the `test` method will run in both Rspack and webpack.

```ts
import { test, expect } from '@playwright/test';

// both webpack and Rspack
test('test 1 + 1', () => {
  expect(1 + 1).toBe(2);
});
```

You can run tests for Rspack only by using the `rspackOnlyTest` method.

```ts
import { rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest('test 1 + 1', () => {
  expect(1 + 1).toBe(2);
});
```
