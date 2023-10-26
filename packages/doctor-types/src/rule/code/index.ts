import { RuleMessage } from './type';

import * as E1001 from './E1001';
import * as E1002 from './E1002';
import * as E1003 from './E1003';
import * as E1004 from './E1004';

export type RuleErrorCodes = {
  [E1001.code]: typeof E1001;
  [E1002.code]: typeof E1002;
  [E1003.code]: typeof E1003;
  [E1004.code]: typeof E1004;
};

/**
 * The format is E + "4 digits".
 * - The first number represents the category:
 * - 1 for Webpack build related indexes
 * - ...
 * - The rest of the numbers can be increased by adding zeros
 */
export const RuleErrorMap: Record<keyof RuleErrorCodes, RuleMessage> = {
  [E1001.code]: E1001.message,
  [E1002.code]: E1002.message,
  [E1003.code]: E1003.message,
  [E1004.code]: E1004.message,
};

export enum DoctorRuleClientConstant {
  UrlQueryForErrorCode = 'code',
}

export * from './type';
