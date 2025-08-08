import fs from 'node:fs';
import { platform } from 'node:os';
import { join } from 'node:path';
import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { expect, type Page, test } from '@playwright/test';
import type { ConsoleType } from '@rsbuild/core';
import glob, {
  convertPathToPattern,
  type Options as GlobOptions,
} from 'fast-glob';

export const providerType = process.env.PROVIDE_TYPE || 'rspack';

process.env.PROVIDE_TYPE = providerType;

export const getProviderTest = (
  supportType: string[] = ['rspack'],
): typeof test => {
  if (supportType.includes(providerType)) {
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
};

export const rspackOnlyTest = getProviderTest(['rspack']);

// fast-glob only accepts posix path
// https://github.com/mrmlnc/fast-glob#convertpathtopatternpath
const convertPath = (path: string) => {
  if (platform() === 'win32') {
    return convertPathToPattern(path);
  }
  return path;
};

/**
 * Read the contents of a directory and return a map of
 * file paths to their contents.
 */
export const readDirContents = async (path: string, options?: GlobOptions) => {
  const files = await glob(convertPath(join(path, '**/*')), options);
  const ret: Record<string, string> = {};

  await Promise.all(
    files.map((file) =>
      fs.promises.readFile(file, 'utf-8').then((content) => {
        ret[file] = content;
      }),
    ),
  );

  return ret;
};

/**
 * Expect a file to exist
 */
export const expectFile = (dir: string) =>
  expectPoll(() => fs.existsSync(dir)).toBeTruthy();

export type ProxyConsoleOptions = {
  types?: ConsoleType | ConsoleType[];
  keepAnsi?: boolean;
};

export type ProxyConsoleResult = {
  logs: string[];
  restore: () => void;
};

/**
 * Proxy the console methods to capture the logs
 */
export const proxyConsole = ({
  types = ['log', 'warn', 'info', 'error'],
  keepAnsi = false,
}: ProxyConsoleOptions = {}): ProxyConsoleResult => {
  const logs: string[] = [];
  const restores: Array<() => void> = [];

  for (const type of Array.isArray(types) ? types : [types]) {
    const method = console[type];

    restores.push(() => {
      console[type] = method;
    });

    console[type] = (log) => {
      logs.push(keepAnsi || typeof log !== 'string' ? log : stripAnsi(log));
    };
  }

  return {
    logs,
    restore: () => {
      for (const restore of restores) {
        restore();
      }
    },
  };
};

// Windows and macOS use different new lines
export const normalizeNewlines = (str: string) => str.replace(/\r\n/g, '\n');

/**
 * A faster `expect.poll`
 */
export const expectPoll = (fn: () => boolean) => {
  return expect.poll(fn, {
    intervals: [20, 30, 40, 50, 60, 70, 80, 90, 100],
  });
};

/**
 * we enable lazy compilation by default, so we need to wait for the page to load
 *
 * This function waits for the HMR (Hot Module Replacement) response to ensure that the page is updated correctly.
 * It waits for a response that includes "hot-update" in the URL, with a timeout of 5000 milliseconds,
 * and then waits for an additional 500 milliseconds to ensure the page has time to reflect the changes.
 * @param page
 * @param timeout
 */
export async function waitForHmr(page: Page, timeout = 100) {
  await Promise.race([
    page.waitForResponse((response) => response.url().includes('hot-update')),
    new Promise((resolve) => {
      setTimeout(resolve, 1000);
    }),
  ]);
  await page.waitForTimeout(timeout);
}
