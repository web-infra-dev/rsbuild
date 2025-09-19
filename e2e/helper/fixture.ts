import {
  type ChildProcess,
  type ExecOptions,
  exec as nodeExec,
} from 'node:child_process';
import { promises } from 'node:fs';
import path from 'node:path';
import base, { expect } from '@playwright/test';
import color from 'picocolors';
import {
  type Build,
  build as baseBuild,
  dev as baseDev,
  type Dev,
  type DevResult,
} from './jsApi';
import { type ExtendedLogHelper, proxyConsole } from './logs';

type EditFile = (
  filename: string,
  replacer: (code: string) => string,
) => Promise<void>;

type Exec = (
  command: string,
  options?: ExecOptions,
) => {
  childProcess: ChildProcess;
};

type RsbuildFixture = {
  /**
   * Absolute working directory of the current test file.
   */
  cwd: string;

  /**
   * Helper to capture and assert console logs.
   * Proxies console methods and collects log lines for assertions.
   * @example
   * // Wait for a specific log line
   * await logHelper.expectLog('some message');
   * // Assert there is no error output
   * logHelper.expectNoLog(/error/);
   * // Clear collected logs
   * logHelper.clearLogs();
   */
  logHelper: ExtendedLogHelper;
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
   * @example
   * await editFile('src/index.ts', (code) =>
   *   code.replace('Hello', 'Hi'),
   * );
   */
  editFile: EditFile;
  /**
   * Execute a command in the test file's cwd.
   * The child process is auto-killed after the test.
   * @param command The command to execute.
   * @param options Optional execution options.
   * @returns An object containing the child process.
   * @example
   * const { childProcess } = exec('npm run build');
   */
  exec: Exec;
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
    async ({}, use, testInfo) => {
      const logHelper = proxyConsole();
      await use(logHelper);
      logHelper.restore();

      // If the test failed, log the console output for debugging
      if (
        testInfo.status !== testInfo.expectedStatus &&
        logHelper.logs.length
      ) {
        // header log
        const header = `╭──────────────  Logs from: "${testInfo.title}" ──────────────╮`;
        console.log(color.bold(`\n${header}\n`));

        // body logs
        logHelper.printCapturedLogs();

        // footer log
        console.log(color.bold(`╰${'─'.repeat(header.length - 2)}╯\n`));
      }
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

  exec: async ({ cwd, logHelper }, use) => {
    let close: (() => void) | undefined;

    const exec: Exec = (command, options) => {
      const childProcess = nodeExec(command, {
        cwd,
        ...options,
      });

      const onData = (data: Buffer) => {
        logHelper.addLog(data.toString());
      };

      childProcess.stdout?.on('data', onData);
      childProcess.stderr?.on('data', onData);

      close = () => {
        childProcess.stdout?.off('data', onData);
        childProcess.stderr?.off('data', onData);
        childProcess.kill();
      };

      return { childProcess };
    };

    await use(exec);
    close?.();
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
