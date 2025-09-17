import { promises } from 'node:fs';
import path from 'node:path';
import base, { expect } from '@playwright/test';
import {
  type Build,
  build as baseBuild,
  dev as baseDev,
  type Dev,
  type DevResult,
} from './jsApi';
import { type LogHelper, proxyConsole } from './logs';

type EditFile = (
  filename: string,
  replacer: (code: string) => string,
) => Promise<void>;

type RsbuildFixture = {
  /**
   * Absolute working directory of the current test file.
   */
  cwd: string;

  logHelper: LogHelper;

  /**
   * Build the project. No preview server or page navigation by default.
   * Uses the test file's cwd.
   * The fixture auto-closes after the test.
   */
  build: Build;

  /**
   * Build the project, start a preview server, and auto-navigate the Playwright page.
   * Uses the test file's cwd.
   * The fixture auto-closes after the test.
   */
  buildPreview: Build;

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

  /**
   * Edit a file in the test file's cwd.
   * @param filename The filename. If it is not absolute, it will be resolved
   * relative to the test file's cwd.
   * @param replacer The replacer function.
   */
  editFile: EditFile;
};

type Close = DevResult['close'];

export const test = base.extend<RsbuildFixture>({
  // biome-ignore lint/correctness/noEmptyPattern: required by playwright
  cwd: async ({}, use, { file }) => {
    const cwd = path.dirname(file);
    await use(cwd);
  },

  logHelper: [
    // biome-ignore lint/correctness/noEmptyPattern: required by playwright
    async ({}, use) => {
      const logHelper = proxyConsole();
      await use(logHelper);
      logHelper.restore();
    },
    { auto: true },
  ],

  build: async ({ cwd, logHelper }, use) => {
    const closes: Close[] = [];
    const build: typeof baseBuild = async (options) => {
      const result = await baseBuild({ cwd, logHelper, ...options });
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

  buildPreview: async ({ cwd, page, logHelper }, use) => {
    const closes: Close[] = [];
    const build: typeof baseBuild = async (options) => {
      const result = await baseBuild({ cwd, page, logHelper, ...options });
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

  dev: async ({ cwd, page, logHelper }, use) => {
    const closes: Close[] = [];
    const dev: typeof baseDev = async (options) => {
      const result = await baseDev({ cwd, page, logHelper, ...options });
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

  devOnly: async ({ cwd, logHelper }, use) => {
    const closes: Close[] = [];
    const dev: typeof baseDev = async (options) => {
      const result = await baseDev({ cwd, logHelper, ...options });
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

  editFile: async ({ cwd }, use) => {
    const editFile: EditFile = async (filename, replacer) => {
      const resolvedFilename = path.isAbsolute(filename)
        ? filename
        : path.resolve(cwd, filename);
      const code = await promises.readFile(resolvedFilename, 'utf-8');
      return promises.writeFile(resolvedFilename, replacer(code));
    };
    await use(editFile);
  },
});

export { expect };

export const rspackTest = ((): typeof test => {
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
