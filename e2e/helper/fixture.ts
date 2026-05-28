import {
  type ChildProcess,
  type ExecOptions,
  type ExecSyncOptions,
  execSync,
  exec as nodeExec,
} from 'node:child_process';
import { constants as fsConstants, promises } from 'node:fs';
import path from 'node:path';
import {
  afterAll as rstestAfterAll,
  afterEach as rstestAfterEach,
  beforeAll as rstestBeforeAll,
  beforeEach as rstestBeforeEach,
  describe as rstestDescribe,
  expect as rstestExpect,
  test as base,
} from '@rstest/core';
import type { Assertion, ExpectStatic } from '@rstest/core';
import fse from 'fs-extra';
import { chromium, request as playwrightRequest } from 'playwright';
import type {
  APIRequestContext,
  Browser,
  BrowserContext,
  Locator,
  Page,
} from 'playwright';
import { RSBUILD_BIN_PATH } from './constants.ts';
import {
  type Build,
  type BuildOptions,
  type BuildResult,
  build as baseBuild,
  dev as baseDev,
  type Dev,
  type DevOptions,
  type DevResult,
} from './jsApi.ts';
import { type ExtendedLogHelper, proxyConsole } from './logs.ts';

const DEFAULT_EXPECT_TIMEOUT = 5000;
const EXPECT_POLL_INTERVAL = 50;

function makeBox(title: string) {
  const header = `╭────────────  Logs from: "${title}" ────────────╮`;
  const footer = `╰────────────  Logs from: "${title}" ────────────╯`;
  return {
    header: `\n${header}\n`,
    footer: `${footer}\n`,
  };
}

type EditFile = (filename: string, replacer: (code: string) => string) => Promise<void>;

type Exec = (
  command: string,
  options?: ExecOptions,
) => {
  childProcess: ChildProcess;
};

type ExecSync = (command: string, options?: ExecSyncOptions) => string;

type SharedAssertionContext =
  | {
      mode: 'dev';
      result: DevResult;
    }
  | {
      mode: 'build';
      result: BuildResult;
    };

type RunBoth = (
  assert: (context: SharedAssertionContext) => Promise<void> | void,
  options?: DevOptions | BuildOptions,
) => Promise<void>;

type CopyNodeModules = () => Promise<string>;

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
   * Copies the source directory to a temporary directory for testing purposes.
   */
  copySrcDir: () => Promise<string>;
  /**
   * Copy _node_modules to node_modules in the test file's cwd.
   * @returns The copied node_modules path.
   * @example
   * await copyNodeModules();
   */
  copyNodeModules: CopyNodeModules;
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
   * Run shared assertions for devOnly and build in one call.
   */
  runBoth: RunBoth;
  /**
   * Run shared assertions for both served dev and preview build in one call.
   */
  runBothServe: RunBoth;
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
  /**
   * Execute an Rsbuild CLI command in the test file's cwd.
   * The child process is auto-killed after the test.
   * @param command The CLI command to execute (without 'rsbuild' prefix).
   * @param options Optional execution options.
   * @returns An object containing the child process.
   * @example
   * const { childProcess } = execCli('build --watch');
   */
  execCli: Exec;
  /**
   * Execute an Rsbuild CLI command synchronously in the test file's cwd.
   * @param command The CLI command to execute (without 'rsbuild' prefix).
   * @param options Optional execution options.
   * @example
   * execCliSync('build', {
   *   // ...options
   * });
   */
  execCliSync: ExecSync;
};

type Close = DevResult['close'];

type BrowserFixture = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  request: APIRequestContext;
};

type E2EFixture = RsbuildFixture & BrowserFixture;

type TextMatcher = string | RegExp;
type TextExpectation = TextMatcher | TextMatcher[];
type MatcherOptions = {
  timeout?: number;
};

type LocatorAssertions = {
  readonly not: LocatorAssertions;
  toBeAttached: (options?: MatcherOptions) => Promise<void>;
  toContainText: (
    expected: TextMatcher,
    options?: MatcherOptions,
  ) => Promise<void>;
  toHaveCSS: (
    propertyName: string,
    expected: string,
    options?: MatcherOptions,
  ) => Promise<void>;
  toHaveCount: (expected: number, options?: MatcherOptions) => Promise<void>;
  toHaveText: (
    expected: TextExpectation,
    options?: MatcherOptions,
  ) => Promise<void>;
};

type PageAssertions = {
  readonly not: PageAssertions;
  toHaveTitle: (
    expected: TextMatcher,
    options?: MatcherOptions,
  ) => Promise<void>;
};

type E2EAssertion<T> = Assertion<T> & LocatorAssertions & PageAssertions;

type E2EExpectStatic = Omit<ExpectStatic, 'soft'> & {
  <T>(actual: T, message?: string): E2EAssertion<T>;
  soft: <T>(actual: T, message?: string) => E2EAssertion<T>;
};

let browserPromise: Promise<Browser> | undefined;

const getBrowser = () => {
  browserPromise ??= chromium.launch({
    // Preserve the previous Playwright CI behavior.
    channel: process.env.CI ? 'chrome' : undefined,
  });
  return browserPromise;
};

const closeBrowser = async () => {
  if (!browserPromise) {
    return;
  }
  const browser = await browserPromise;
  browserPromise = undefined;
  await browser.close();
};

rstestAfterAll(closeBrowser);

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasFunction = <K extends string>(
  value: unknown,
  key: K,
): value is Record<K, (...args: never[]) => unknown> =>
  isRecord(value) && typeof value[key] === 'function';

const isLocator = (value: unknown): value is Locator =>
  hasFunction(value, 'count') &&
  hasFunction(value, 'evaluate') &&
  hasFunction(value, 'textContent');

const isPage = (value: unknown): value is Page =>
  hasFunction(value, 'goto') &&
  hasFunction(value, 'locator') &&
  hasFunction(value, 'title');

const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();

const formatValue = (value: unknown) =>
  typeof value === 'string' ? JSON.stringify(value) : String(value);

const matchesText = (
  actual: string,
  expected: TextMatcher,
  mode: 'exact' | 'contain',
) => {
  if (expected instanceof RegExp) {
    expected.lastIndex = 0;
    return expected.test(actual);
  }

  const normalizedActual = normalizeText(actual);
  const normalizedExpected = normalizeText(expected);

  return mode === 'exact'
    ? normalizedActual === normalizedExpected
    : normalizedActual.includes(normalizedExpected);
};

const getLocatorTextContent = async (locator: Locator) => {
  const texts = await getLocatorTextContents(locator);
  return texts.join('');
};

const getLocatorTextContents = (locator: Locator) =>
  locator.evaluateAll((elements) => {
    const getDeepTextContent = (node: Node): string => {
      let text = '';

      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent ?? '';
      }

      if (node instanceof Element && node.shadowRoot) {
        text += getDeepTextContent(node.shadowRoot);
      }

      for (const child of node.childNodes) {
        text += getDeepTextContent(child);
      }

      return text;
    };

    return elements.map((element) => getDeepTextContent(element));
  });

const assertExpectation = (
  pass: boolean,
  isNot: boolean,
  defaultMessage: string,
  customMessage?: string,
) => {
  const shouldThrow = isNot ? pass : !pass;
  if (!shouldThrow) {
    return;
  }
  throw new Error(
    customMessage ? `${customMessage}\n${defaultMessage}` : defaultMessage,
  );
};

const waitForExpectation = async (
  check: () => Promise<void>,
  options?: MatcherOptions,
) => {
  const timeout = options?.timeout ?? DEFAULT_EXPECT_TIMEOUT;
  const start = Date.now();
  let lastError: unknown;

  while (Date.now() - start <= timeout) {
    try {
      await check();
      return;
    } catch (error) {
      lastError = error;
      await sleep(EXPECT_POLL_INTERVAL);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error(String(lastError));
};

const createLocatorAssertions = (
  locator: Locator,
  isNot: boolean,
  message?: string,
): LocatorAssertions => ({
  get not() {
    return createLocatorAssertions(locator, !isNot, message);
  },

  async toBeAttached(options) {
    await waitForExpectation(async () => {
      const count = await locator.count();
      const pass = count > 0;
      assertExpectation(
        pass,
        isNot,
        `Expected locator ${isNot ? 'not ' : ''}to be attached, received count ${count}.`,
        message,
      );
    }, options);
  },

  async toContainText(expected, options) {
    await waitForExpectation(async () => {
      const actual = await getLocatorTextContent(locator);
      const pass = matchesText(actual, expected, 'contain');
      assertExpectation(
        pass,
        isNot,
        `Expected locator ${isNot ? 'not ' : ''}to contain text ${formatValue(
          expected,
        )}, received ${formatValue(actual)}.`,
        message,
      );
    }, options);
  },

  async toHaveCSS(propertyName, expected, options) {
    await waitForExpectation(async () => {
      const actual = await locator.evaluate(
        (element, property) =>
          getComputedStyle(element).getPropertyValue(property),
        propertyName,
      );
      const pass = actual === expected;
      assertExpectation(
        pass,
        isNot,
        `Expected locator ${isNot ? 'not ' : ''}to have CSS ${propertyName}: ${formatValue(
          expected,
        )}, received ${formatValue(actual)}.`,
        message,
      );
    }, options);
  },

  async toHaveCount(expected, options) {
    await waitForExpectation(async () => {
      const actual = await locator.count();
      const pass = actual === expected;
      assertExpectation(
        pass,
        isNot,
        `Expected locator ${isNot ? 'not ' : ''}to have count ${expected}, received ${actual}.`,
        message,
      );
    }, options);
  },

  async toHaveText(expected, options) {
    await waitForExpectation(async () => {
      if (Array.isArray(expected)) {
        const actual = await getLocatorTextContents(locator);
        const pass =
          actual.length === expected.length &&
          actual.every((item, index) =>
            matchesText(item, expected[index], 'exact'),
          );
        assertExpectation(
          pass,
          isNot,
          `Expected locator ${isNot ? 'not ' : ''}to have text ${formatValue(
            expected,
          )}, received ${formatValue(actual)}.`,
          message,
        );
        return;
      }

      const actual = await getLocatorTextContent(locator);
      const pass = matchesText(actual, expected, 'exact');
      assertExpectation(
        pass,
        isNot,
        `Expected locator ${isNot ? 'not ' : ''}to have text ${formatValue(
          expected,
        )}, received ${formatValue(actual)}.`,
        message,
      );
    }, options);
  },
});

const createPageAssertions = (
  page: Page,
  isNot: boolean,
  message?: string,
): PageAssertions => ({
  get not() {
    return createPageAssertions(page, !isNot, message);
  },

  async toHaveTitle(expected, options) {
    await waitForExpectation(async () => {
      const actual = await page.title();
      const pass = matchesText(actual, expected, 'exact');
      assertExpectation(
        pass,
        isNot,
        `Expected page ${isNot ? 'not ' : ''}to have title ${formatValue(
          expected,
        )}, received ${formatValue(actual)}.`,
        message,
      );
    }, options);
  },
});

const expectImpl = (<T>(actual: T, message?: string) => {
  if (isLocator(actual)) {
    return createLocatorAssertions(actual, false, message);
  }

  if (isPage(actual)) {
    return createPageAssertions(actual, false, message);
  }

  return rstestExpect(actual, message);
}) as E2EExpectStatic;

Object.assign(expectImpl, rstestExpect);

const setupExecOptions = <T extends ExecOptions | ExecSyncOptions>(
  options: T,
  cwd: string,
): T => {
  // inherit process.env from current process
  const { NODE_ENV: _, ...restEnv } = process.env;
  options.env ||= {};
  options.env = { ...restEnv, ...options.env };
  options.cwd ||= cwd;
  return options;
};

const rsbuildTest = base.extend<E2EFixture>({
  browser: async (_context, use) => {
    const browser = await getBrowser();
    await use(browser);
  },

  context: async ({ browser }, use) => {
    const context = await browser.newContext();
    try {
      await use(context);
    } finally {
      await context.close();
    }
  },

  page: async ({ context }, use) => {
    const page = await context.newPage();
    try {
      await use(page);
    } finally {
      await page.close();
    }
  },

  request: async (_context, use) => {
    const request = await playwrightRequest.newContext();
    try {
      await use(request);
    } finally {
      await request.dispose();
    }
  },

  cwd: async ({ expect: currentExpect }, use) => {
    const testPath = currentExpect.getState().testPath;
    if (!testPath) {
      throw new Error('Failed to resolve current test file path.');
    }
    const cwd = path.dirname(testPath);
    await use(cwd);
  },

  logHelper: [
    async ({ task }, use) => {
      const logHelper = proxyConsole();
      await use(logHelper);
      logHelper.restore();

      // If the test failed, log the console output for debugging
      if (task.result?.status === 'fail' && logHelper.logs.length) {
        const { header, footer } = makeBox(task.name);
        console.log(header);
        logHelper.printCapturedLogs();
        console.log(footer);
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

  runBoth: async ({ devOnly, build }, use) => {
    await use(async (assert, options) => {
      const devResult = await devOnly(options);
      await assert({ mode: 'dev', result: devResult });
      const buildResult = await build(options);
      await assert({ mode: 'build', result: buildResult });
    });
  },

  runBothServe: async ({ dev, buildPreview }, use) => {
    await use(async (assert, options) => {
      const devResult = await dev(options);
      await assert({ mode: 'dev', result: devResult });
      const buildResult = await buildPreview(options);
      await assert({ mode: 'build', result: buildResult });
    });
  },

  editFile: async ({ cwd }, use) => {
    const editFile: EditFile = async (filename, replacer) => {
      const resolvedFilename = path.isAbsolute(filename) ? filename : path.resolve(cwd, filename);
      const code = await promises.readFile(resolvedFilename, 'utf-8');
      return promises.writeFile(resolvedFilename, replacer(code));
    };
    await use(editFile);
  },

  exec: async ({ cwd, logHelper }, use) => {
    let close: (() => void) | undefined;

    const exec: Exec = (command, options = {}) => {
      const childProcess = nodeExec(command, setupExecOptions(options, cwd));

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

  execCli: async ({ exec }, use) => {
    const execCli: Exec = (command, options = {}) => {
      return exec(`node ${RSBUILD_BIN_PATH} ${command}`, options);
    };
    await use(execCli);
  },

  execCliSync: async ({ cwd }, use) => {
    const execCliSync: ExecSync = (command, options = {}) => {
      return execSync(
        `node ${RSBUILD_BIN_PATH} ${command}`,
        setupExecOptions(options, cwd),
      ).toString();
    };
    await use(execCliSync);
  },

  copySrcDir: async ({ cwd }, use) => {
    const copySrcDir = async () => {
      const targetDir = path.join(cwd, 'test-temp-src');
      await fse.remove(targetDir);
      await promises.cp(path.join(cwd, 'src'), targetDir, {
        recursive: true,
        mode: fsConstants.COPYFILE_FICLONE,
      });
      return targetDir;
    };
    await use(copySrcDir);
  },

  copyNodeModules: async ({ cwd }, use) => {
    const copyNodeModules: CopyNodeModules = async () => {
      const targetDir = path.join(cwd, 'node_modules');
      await fse.remove(targetDir);
      await fse.copy(path.join(cwd, '_node_modules'), targetDir);
      return targetDir;
    };

    await use(copyNodeModules);
  },
});

type Callable<T> = T extends (...args: infer Args) => infer Return
  ? (...args: Args) => Return
  : never;

type E2ETestSkip = Callable<typeof rsbuildTest.skip> &
  (() => void) &
  Omit<typeof rsbuildTest.skip, 'skip'> & {
    skip: E2ETestSkip;
  };

type E2ETest = Callable<typeof rsbuildTest> &
  Omit<typeof rsbuildTest, 'skip'> & {
    afterAll: typeof rstestAfterAll;
    afterEach: typeof rstestAfterEach;
    beforeAll: typeof rstestBeforeAll;
    beforeEach: typeof rstestBeforeEach;
    describe: typeof rstestDescribe;
    fail: typeof rsbuildTest.fails;
    skip: E2ETestSkip;
  };

export const test = Object.assign(rsbuildTest, {
  afterAll: rstestAfterAll,
  afterEach: rstestAfterEach,
  beforeAll: rstestBeforeAll,
  beforeEach: rstestBeforeEach,
  describe: rstestDescribe,
  fail: rsbuildTest.fails,
}) as E2ETest;

export const expect = expectImpl;
