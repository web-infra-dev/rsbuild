import type { ECMAVersion } from '@rsbuild/doctor-utils/ruleUtils';

export interface Config {
  /** Check the ecma version */
  highestVersion: ECMAVersion;
  /** Js files that need to be ignored */
  ignore: string[];
}
