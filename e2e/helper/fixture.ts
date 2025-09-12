import path from 'node:path';
import base, { expect } from '@playwright/test';
import {
  type Build,
  build as baseBuild,
  dev as baseDev,
  type Dev,
  type DevResult,
} from './jsApi';

type RsbuildFixture = {
  /**
   * Absolute working directory of the current test file.
   */
  cwd: string;

  /**
   * Build the project, start a preview server, and auto-navigate the Playwright page.
   * Uses the test file's cwd.
   * The fixture auto-closes after the test.
   */
  build: Build;

  /**
   * Build only. No preview server or page navigation by default.
   * Uses the test file's cwd.
   * The fixture auto-closes after the test.
   */
  buildOnly: Build;

  /**
   * Start the dev server and auto-navigate the Playwright page.
   * Uses the test file's cwd.
   * Waits for the first compile by default.
   * The fixture auto-closes after the test.
   */
  dev: Dev;

  /**
   * Start the dev server without page navigation.
   * Uses the test file's cwd.
   * The fixture auto-closes after the test.
   */
  devOnly: Dev;
};

type Close = DevResult['close'];

export const test = base.extend<RsbuildFixture>({
  // biome-ignore lint/correctness/noEmptyPattern: required by playwright
  cwd: async ({}, use, { file }) => {
    const cwd = path.dirname(file);
    await use(cwd);
  },

  build: async ({ cwd, page }, use) => {
    const closes: Close[] = [];
    const build: typeof baseBuild = async (options) => {
      const result = await baseBuild({ cwd, page, ...options });
      closes.push(result.close);
      return result;
    };

    try {
      await use(build);
    } finally {
      for (const close of closes) {
        await close();
      }
    }
  },

  buildOnly: async ({ cwd }, use) => {
    const closes: Close[] = [];
    const build: typeof baseBuild = async (options) => {
      const result = await baseBuild({ cwd, ...options });
      closes.push(result.close);
      return result;
    };

    try {
      await use(build);
    } finally {
      for (const close of closes) {
        await close();
      }
    }
  },

  dev: async ({ cwd, page }, use) => {
    const closes: Close[] = [];
    const dev: typeof baseDev = async (options) => {
      const result = await baseDev({ cwd, page, ...options });
      closes.push(result.close);
      return result;
    };

    try {
      await use(dev);
    } finally {
      for (const close of closes) {
        await close();
      }
    }
  },

  devOnly: async ({ cwd }, use) => {
    const closes: Close[] = [];
    const dev: typeof baseDev = async (options) => {
      const result = await baseDev({ cwd, ...options });
      closes.push(result.close);
      return result;
    };

    try {
      await use(dev);
    } finally {
      for (const close of closes) {
        await close();
      }
    }
  },
});

export { expect };

export const rspackOnlyTest = ((): typeof test => {
  if (process.env.PROVIDE_TYPE !== 'webpack') {
    return test;
  }

  const testSkip = test.skip;
  // @ts-expect-error
  testSkip.describe = test.describe.skip;
  // @ts-expect-error
  testSkip.fail = test.describe.skip;
  // @ts-expect-error
  testSkip.only = test.only;
  // @ts-expect-error
  return testSkip as typeof test.skip & {
    describe: typeof test.describe.skip;
    only: typeof test.only;
  };
})();
