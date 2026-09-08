import { stripVTControlCharacters } from 'node:util';
import {
  type ExtendedLogHelper as BaseExtendedLogHelper,
  type LogHelper as BaseLogHelper,
  proxyConsole as baseProxyConsole,
  type ProxyConsoleOptions,
} from '@rstackjs/test-utils';
import { BUILD_END_LOG } from './constants.ts';

type BuildLogHelper = {
  expectBuildEnd: () => Promise<boolean>;
  /** Allow build warnings for this test. Expected warnings should still be asserted. */
  allowBuildWarnings: () => void;
  expectNoBuildWarnings: () => void;
};

export type LogHelper = BaseLogHelper & BuildLogHelper;

export type ExtendedLogHelper = BaseExtendedLogHelper & BuildLogHelper;

export const proxyConsole = (
  options?: ProxyConsoleOptions,
): ExtendedLogHelper => {
  const logHelper = baseProxyConsole(options);
  let buildWarningsAllowed = false;

  return {
    ...logHelper,
    expectBuildEnd: async () => logHelper.expectLog(BUILD_END_LOG),
    allowBuildWarnings: () => {
      buildWarningsAllowed = true;
    },
    expectNoBuildWarnings: () => {
      // Keep warnings across clearLogs() and join split CLI output before matching.
      const output = stripVTControlCharacters(logHelper.originalLogs.join(''));
      if (!buildWarningsAllowed && /\bBuild warnings?:/.test(output)) {
        throw new Error(
          `Unexpected build warning. Call logHelper.allowBuildWarnings() only in tests that intentionally verify warnings.\n\n${output}`,
        );
      }
    },
  };
};
