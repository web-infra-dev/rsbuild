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
  /** Assert an expected warning and allow build warnings for this test. */
  expectWarning: BaseLogHelper['expectLog'];
  /** Allow build warnings without asserting a specific message. Prefer expectWarning(). */
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
    expectWarning: (...args) => {
      buildWarningsAllowed = true;
      return logHelper.expectLog(...args);
    },
    allowBuildWarnings: () => {
      buildWarningsAllowed = true;
    },
    expectNoBuildWarnings: () => {
      // Keep warnings across clearLogs() and join split CLI output before matching.
      const output = stripVTControlCharacters(logHelper.originalLogs.join(''));
      if (!buildWarningsAllowed && /\bBuild warnings?:/.test(output)) {
        throw new Error(
          `Unexpected build warning. Use expectWarning() to assert intentional warnings.\n\n${output}`,
        );
      }
    },
  };
};
