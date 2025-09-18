# @rsbuild/e2e

This folder contains the E2E test cases of Rsbuild. The E2E suite is powered by [Playwright](https://github.com/microsoft/playwright).

## Directory structure

- `cases`: Test cases covering different Rsbuild features.
- `assets`: Common static assets, can be accessed using the `@e2e/assets` package.
- `scripts`: Shared helpers, can be accessed using the `@e2e/helper` package.

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
