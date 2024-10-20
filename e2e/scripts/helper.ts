import fs from 'node:fs';
import { join } from 'node:path';
import { test } from '@playwright/test';
import type { ConsoleType } from '@rsbuild/core';
import stripAnsi from 'strip-ansi';
import { type GlobOptions, glob } from 'tinyglobby';

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
  return testSkip as typeof test.skip & {
    describe: typeof test.describe.skip;
  };
};

export const webpackOnlyTest = getProviderTest(['webpack']);
export const rspackOnlyTest = getProviderTest(['rspack']);

export const globContentJSON = async (path: string, options?: GlobOptions) => {
  const files = await glob(join(path, '**/*'), {
    absolute: true,
    ...options,
  });
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

export const waitFor = async (
  fn: () => boolean,
  {
    maxChecks = 100,
    interval = 20,
  }: {
    maxChecks?: number;
    interval?: number;
  } = {},
) => {
  let checks = 0;

  while (checks < maxChecks) {
    if (fn()) {
      return true;
    }
    checks++;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  return false;
};

export const awaitFileExists = async (dir: string) => {
  const result = await waitFor(() => fs.existsSync(dir), { interval: 50 });
  if (!result) {
    throw new Error(`awaitFileExists failed: ${dir}`);
  }
};

export const proxyConsole = (
  types: ConsoleType | ConsoleType[] = ['log', 'warn', 'info', 'error'],
  keepAnsi = false,
) => {
  const logs: string[] = [];
  const restores: Array<() => void> = [];

  for (const type of Array.isArray(types) ? types : [types]) {
    const method = console[type];

    restores.push(() => {
      console[type] = method;
    });

    console[type] = (log) => {
      logs.push(keepAnsi ? log : stripAnsi(log));
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
