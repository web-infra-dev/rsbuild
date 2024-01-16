import { expect } from '@playwright/test';
import { build, proxyConsole, webpackOnlyTest } from '@e2e/helper';

// TODO: needs rspack exportsPresence error
// https://github.com/web-infra-dev/rspack/issues/4323
webpackOnlyTest(
  'should throw error by default (exportsPresence error)',
  async () => {
    const { logs, restore } = proxyConsole();

    await expect(
      build({
        cwd: __dirname,
      }),
    ).rejects.toThrowError();

    restore();

    expect(
      logs.find((log) =>
        log.includes(
          `export 'aa' (imported as 'aa') was not found in './test'`,
        ),
      ),
    ).toBeTruthy();
  },
);
