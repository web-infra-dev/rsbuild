# @rsbuild/e2e

This folder contains the e2e test cases of Rsbuild.

## Tech stack

- [playwright](https://github.com/microsoft/playwright): The e2e test framework.

## Commands

Most of the E2E tests in Rsbuild are run by both Rspack and webpack at the same time. This is to check that the functionality of Rspack is correctly aligned with webpack.

```bash
# Run all test cases, including Rspack and webpack
pnpm e2e

# Run test cases for Rspack
pnpm e2e:rspack

# Run test cases for webpack
pnpm e2e:webpack

# Run specific test case, such as "css"
pnpm e2e:webpack css
pnpm e2e:rspack css
```

## Debugging

If a test directory includes an `rsbuild.config.*` file, you can simply run `npx rsbuild dev` or `npx rsbuild build` to start it. This approach provides a simpler and more convenient way to debug.

```bash
cd cases/assets/emit-assets
npx rsbuild dev
npx rsbuild build
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

You can run tests for Rspack only by using the `rspackTest` method.

```ts
import { rspackTest } from '@e2e/helper';

rspackTest('test 1 + 1', () => {
  expect(1 + 1).toBe(2);
});
```
