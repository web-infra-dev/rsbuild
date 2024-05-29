import { platform } from 'node:os';
import { join } from 'node:path';
import { test } from '@playwright/test';
import { type ConsoleType, castArray, fse } from '@rsbuild/shared';
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
  return testSkip as typeof test.skip & {
    describe: typeof test.describe.skip;
  };
};

export const webpackOnlyTest = getProviderTest(['webpack']);
export const rspackOnlyTest = getProviderTest(['rspack']);

// fast-glob only accepts posix path
// https://github.com/mrmlnc/fast-glob#convertpathtopatternpath
const convertPath = (path: string) => {
  if (platform() === 'win32') {
    return convertPathToPattern(path);
  }
  return path;
};

export const globContentJSON = async (path: string, options?: GlobOptions) => {
  const files = await glob(convertPath(join(path, '**/*')), options);
  const ret: Record<string, string> = {};

  await Promise.all(
    files.map((file) =>
      fse.readFile(file, 'utf-8').then((content) => {
        ret[file] = content;
      }),
    ),
  );

  return ret;
};

export const awaitFileExists = async (dir: string) => {
  const maxChecks = 100;
  const interval = 100;
  let checks = 0;

  while (checks < maxChecks) {
    if (fse.existsSync(dir)) {
      return;
    }
    checks++;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`awaitFileExists failed: ${dir}`);
};

export const proxyConsole = (
  types: ConsoleType | ConsoleType[] = ['log', 'warn', 'info', 'error'],
) => {
  const logs: string[] = [];
  const restores: Array<() => void> = [];

  for (const type of castArray(types)) {
    const method = console[type];

    restores.push(() => {
      console[type] = method;
    });

    console[type] = (log) => {
      logs.push(log);
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
